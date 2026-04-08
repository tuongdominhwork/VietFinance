const prisma = require('../config/db');
const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
const { searchChunks } = require('../services/vectorSearch');

const ROLE_RANK = Object.freeze({
  customer: 1,
  employee: 2,
  manager: 3,
  admin: 4,
});

function canAccessDocument(userRole, docPermission) {
  const ur = ROLE_RANK[String(userRole || '').toLowerCase()] ?? 0;
  const dr = ROLE_RANK[String(docPermission || '').toLowerCase()] ?? 0;
  if (dr === 0) return false;
  return ur >= dr;
}

function allowedPermissionsForRole(role) {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') return ['admin', 'manager', 'employee', 'customer'];
  if (r === 'manager') return ['manager', 'employee', 'customer'];
  if (r === 'employee') return ['employee', 'customer'];
  return ['customer'];
}

async function buildTree(parentId, allowedPermissions) {
  const folders = await prisma.folder.findMany({
    where: { parentId: parentId ?? null, permission: { in: allowedPermissions } },
    orderBy: { name: 'asc' },
  });

  return Promise.all(
    folders.map(async (folder, index) => {
      const children = await buildTree(folder.id, allowedPermissions);
      const docCount = await prisma.document.count({
        where: { folderId: folder.id, permission: { in: allowedPermissions } },
      });
      const totalCount = docCount + children.reduce((s, c) => s + c.count, 0);
      return {
        id: folder.id,
        name: folder.name,
        count: totalCount,
        open: parentId === null && index === 0, // open first root folder by default
        children: children.length > 0 ? children : undefined,
      };
    })
  );
}

exports.getFolderTree = async (req, res) => {
  try {
    const allowed = allowedPermissionsForRole(req.user?.role);
    const tree = await buildTree(null, allowed);
    res.json({ folders: tree });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getFolderContents = async (req, res) => {
  const folderId = parseInt(req.params.id);
  if (isNaN(folderId)) return res.status(400).json({ message: 'Invalid folder ID' });

  try {
    const allowed = allowedPermissionsForRole(req.user?.role);
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    if (!allowed.includes(String(folder.permission || '').toLowerCase())) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const subfolders = await prisma.folder.findMany({
      where: { parentId: folderId, permission: { in: allowed } },
      orderBy: { name: 'asc' },
    });

    const documents = await prisma.document.findMany({
      where: { folderId, permission: { in: allowed } },
      include: { addedBy: { select: { email: true } } },
      orderBy: { name: 'asc' },
    });

    res.json({
      folder: { id: folder.id, name: folder.name },
      subfolders: await Promise.all(subfolders.map(async (f) => {
        const count = await prisma.document.count({
          where: { folderId: f.id, permission: { in: allowed } },
        });
        return {
          id: f.id,
          name: f.name,
          count: `${count} File${count !== 1 ? 's' : ''}`,
        };
      })),
      documents: documents.map(d => ({
        id: d.id,
        name: d.name,
        addedBy: d.addedBy.email,
        modified: formatDate(d.updatedAt),
        size: d.size,
        kind: d.kind,
        permission: capitalize(d.permission),
        fileUrl: d.filePath ? `${BASE_URL}/${d.filePath}` : null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.searchDocuments = async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) return res.status(400).json({ message: 'Missing query (q)' });

  const topKDocsRaw = req.query.topK;
  const minScoreRaw = req.query.minScore;

  const topKDocs = topKDocsRaw !== undefined ? Number(topKDocsRaw) : 10;
  const minScore = minScoreRaw !== undefined ? Number(minScoreRaw) : 0.3;

  if (!Number.isFinite(topKDocs) || topKDocs <= 0) {
    return res.status(400).json({ message: 'Invalid topK' });
  }
  if (!Number.isFinite(minScore) || minScore < 0 || minScore > 1) {
    return res.status(400).json({ message: 'Invalid minScore' });
  }

  try {
    // Fetch more chunk hits than final doc count so grouping still yields enough docs.
    const chunksToFetch = Math.max(25, Math.ceil(topKDocs * 6));
    const hits = await searchChunks(q, { topK: chunksToFetch, minScore });

    const byDoc = new Map();
    for (const hit of hits) {
      const existing = byDoc.get(hit.documentId);
      if (!existing) {
        byDoc.set(hit.documentId, {
          documentId: hit.documentId,
          score: hit.score,
          highlights: [{ text: hit.text, score: hit.score }],
        });
      } else {
        existing.score = Math.max(existing.score, hit.score);
        existing.highlights.push({ text: hit.text, score: hit.score });
      }
    }

    for (const entry of byDoc.values()) {
      entry.highlights.sort((a, b) => b.score - a.score);
      entry.highlights = entry.highlights.slice(0, 2);
    }

    const rankedBySemanticAll = Array.from(byDoc.values()).sort((a, b) => b.score - a.score);
    const docIds = rankedBySemanticAll.map(r => r.documentId);

    const documentsRaw = docIds.length === 0 ? [] : await prisma.document.findMany({
      where: { id: { in: docIds } },
      include: { addedBy: { select: { email: true } } },
    });
    const documents = documentsRaw.filter(d => canAccessDocument(req.user?.role, d.permission));

    const qTokens = q
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .map(t => t.trim())
      .filter(t => t.length >= 3);

    function titleBoost(docName) {
      const name = String(docName ?? '').toLowerCase();
      if (!name || qTokens.length === 0) return 0;
      let hitsCount = 0;
      for (const tok of qTokens) {
        if (name.includes(tok)) hitsCount++;
      }
      if (hitsCount === 0) return 0;
      // Up to +0.25 boost when most tokens match the title/filename.
      return Math.min(0.25, 0.08 + (hitsCount / qTokens.length) * 0.17);
    }

    const docById = new Map(documents.map(d => [d.id, d]));
    const enriched = rankedBySemanticAll
      .map(r => {
        const d = docById.get(r.documentId);
        if (!d) return null;
        const boost = titleBoost(d.name);
        return {
          document: {
            id: d.id,
            name: d.name,
            addedBy: d.addedBy?.email ?? 'Unknown',
            modified: formatDate(d.updatedAt),
            size: d.size,
            kind: d.kind,
            permission: capitalize(d.permission),
            fileUrl: d.filePath ? `${BASE_URL}/${d.filePath}` : null,
          },
          score: r.score,
          finalScore: r.score + boost,
          highlights: r.highlights,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, topKDocs);

    const results = enriched.map(({ finalScore: _finalScore, ...rest }) => rest);

    res.json({ query: q, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

function formatDate(date) {
  const now = new Date();
  const d = new Date(date);
  if (d.toDateString() === now.toDateString()) {
    return `Today at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
