const prisma = require('../config/db');
const { searchChunks } = require('../services/vectorSearch');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:e4b';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
const MAX_HISTORY_MESSAGES = Number(process.env.MAX_HISTORY_MESSAGES || 20);
const MAX_CONTEXT_CHARS = Number(process.env.MAX_CONTEXT_CHARS || 2500);

const ROLE_RANK = Object.freeze({
  customer: 1,
  employee: 2,
  manager: 3,
  admin: 4,
});

function canAccessDocument(userRole, docPermission) {
  const ur = ROLE_RANK[String(userRole || '').toLowerCase()] ?? 0;
  const dr = ROLE_RANK[String(docPermission || '').toLowerCase()] ?? 0;
  // If permission is unknown, treat as restricted.
  if (dr === 0) return false;
  return ur >= dr;
}

function tokenizeQuery(q) {
  return String(q || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map(t => t.trim())
    .filter(t => t.length >= 2);
}

function titleBoost(docName, qTokens) {
  const name = String(docName ?? '').toLowerCase();
  if (!name || !qTokens || qTokens.length === 0) return 0;
  let hitsCount = 0;
  for (const tok of qTokens) {
    if (name.includes(tok)) hitsCount++;
  }
  if (hitsCount === 0) return 0;
  // Up to +0.25 boost when many tokens match filename/title.
  return Math.min(0.25, 0.08 + (hitsCount / qTokens.length) * 0.17);
}

const SYSTEM_PROMPT = `You are VietFinance AI, a helpful assistant for VietFinance — a Vietnamese banking and financial services platform.
You help customers with banking questions, financial products, account management, and general financial advice relevant to the Vietnamese market.
Be concise, professional, and friendly. Respond in the same language the user writes in (Vietnamese or English).

Important:
- Do NOT claim you "don't have access" to documents. Access control is handled by the system.
- If you were not given relevant document excerpts, say: "I couldn't find relevant excerpts in the indexed documents for this question."`;

async function callOllama(messages) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.message.content;
}

function toPlainText(text) {
  if (typeof text !== 'string' || text.length === 0) return '';

  let s = text;

  // Convert fenced code blocks to plain text (drop the fences, keep content).
  s = s.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, '$1');

  // Inline code: `code` -> code
  s = s.replace(/`([^`]+)`/g, '$1');

  // Bold/italic markers: **x**, __x__, *x*, _x_ -> x
  // Run a couple passes to handle nested/emitted formatting.
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
    s = s.replace(/__([^_]+)__/g, '$1');
    s = s.replace(/\*([^*\n]+)\*/g, '$1');
    s = s.replace(/_([^_\n]+)_/g, '$1');
  }

  // Strip residual lone formatting characters.
  s = s.replace(/[*_]+/g, '');

  // Normalize whitespace (keep paragraph breaks).
  s = s.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

exports.getSessions = async (req, res) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      sessions: sessions.map(s => ({
        id: s.id,
        title: s.title,
        time: formatRelativeTime(s.updatedAt),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createSession = async (req, res) => {
  const { title } = req.body;
  try {
    const session = await prisma.chatSession.create({
      data: {
        title: title || 'New Chat',
        userId: req.user.id,
        messages: {
          create: [{
            role: 'ai',
            text: "Hello! I'm VietFinance AI. How can I assist you with your banking needs today?",
          }],
        },
      },
      include: { messages: true },
    });

    res.status(201).json({
      session: {
        id: session.id,
        title: session.title,
        time: formatRelativeTime(session.updatedAt),
      },
      messages: session.messages.map(formatMessage),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getMessages = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  if (isNaN(sessionId)) return res.status(400).json({ message: 'Invalid session ID' });

  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: req.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!session) return res.status(404).json({ message: 'Session not found' });

    res.json({ messages: session.messages.map(formatMessage) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.addMessage = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const { text } = req.body;

  if (!text || !text.trim()) return res.status(400).json({ message: 'text is required' });

  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: req.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: { sessionId, role: 'user', text: text.trim() },
    });

    // Auto-title from first user message
    if (session.title === 'New Chat') {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: text.length > 45 ? text.substring(0, 45) + '...' : text.trim() },
      });
    }

    // Build conversation history for Ollama (exclude the greeting message).
    // Keep history bounded so we don't push out earlier context with RAG inserts.
    const historyAll = session.messages
      .filter(m => !(m.role === 'ai' && session.messages.indexOf(m) === 0))
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
    const history = historyAll.slice(-Math.max(0, MAX_HISTORY_MESSAGES));

    // Retrieve relevant document context (RAG)
    const question = text.trim();
    let contextBlock = '';
    try {
      const simplified = question
        .replace(/^(give me|give us|provide)\s+(a\s+)?(brief|summary|overview)\s+(of|about)\s+/i, '')
        .replace(/^(summarize|summary of)\s+/i, '')
        .trim();
      const queries = Array.from(new Set([question, simplified].filter(Boolean)));

      const merged = [];
      for (const q of queries) {
        // Pull a larger candidate set; document-level ranking will pick the best.
        const one = await searchChunks(q, { topK: 60, minScore: 0.05 });
        merged.push(...one);
      }

      // Deduplicate identical chunk texts per document (can happen across query variants).
      const seen = new Set();
      const hits = [];
      for (const h of merged) {
        const key = `${h.documentId}::${h.text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push(h);
      }

      const docIds = Array.from(new Set(hits.map(h => h.documentId)));
      const docs = docIds.length === 0 ? [] : await prisma.document.findMany({
        where: { id: { in: docIds } },
        select: { id: true, name: true, filePath: true, permission: true },
      });
      const allowedDocIds = new Set(
        docs
          .filter(d => canAccessDocument(req.user?.role, d.permission))
          .map(d => d.id)
      );
      const restrictedDocIds = new Set(
        docs
          .filter(d => !canAccessDocument(req.user?.role, d.permission))
          .map(d => d.id)
      );
      const docById = new Map(docs.map(d => [d.id, d]));

      // Boost chunk scores if the document title matches the query tokens.
      const qTokens = tokenizeQuery(simplified || question);
      const boosted = hits
        .filter(h => allowedDocIds.has(h.documentId))
        .map(h => {
          const d = docById.get(h.documentId);
          const boost = titleBoost(d?.name, qTokens);
          return { ...h, _finalScore: h.score + boost };
        })
        .sort((a, b) => b._finalScore - a._finalScore);

      const lines = [];
      for (const h of boosted.slice(0, 10)) {
        const d = docById.get(h.documentId);
        const url = d?.filePath ? `${BASE_URL}/${d.filePath}` : null;
        const snippet = String(h.text || '').replace(/\s+/g, ' ').trim();
        lines.push([
          `Source: ${d?.name ?? h.documentName ?? `Document ${h.documentId}`}`,
          url ? `URL: ${url}` : null,
          `Relevance: ${h.score.toFixed(3)}`,
          `Excerpt: ${snippet.length > 600 ? `${snippet.slice(0, 600)}…` : snippet}`,
        ].filter(Boolean).join('\n'));
      }

      const joined = lines.join('\n\n---\n\n').trim();
      if (joined) {
        // Keep context bounded so chats don't blow up prompt size.
        contextBlock = joined.length > MAX_CONTEXT_CHARS ? `${joined.slice(0, MAX_CONTEXT_CHARS)}…` : joined;
      }

      // If we found relevant hits but they all point to restricted documents,
      // we should tell the assistant to respond with a permission warning.
      if (!contextBlock) {
        const hasRestrictedHits = hits.some(h => restrictedDocIds.has(h.documentId));
        const hasAllowedHits = hits.some(h => allowedDocIds.has(h.documentId));
        if (hasRestrictedHits && !hasAllowedHits) {
          contextBlock = '__PERMISSION_DENIED__';
        }
      }
    } catch (ragErr) {
      console.error('RAG search error:', ragErr.message);
    }

    if (contextBlock && contextBlock !== '__PERMISSION_DENIED__') {
      history.push({
        role: 'system',
        content: [
          'You have access to the following document excerpts for this user question.',
          'Use them when relevant and cite the source name naturally in the answer.',
          'Do NOT say you do not have access to documents.',
          'If the excerpts are not relevant or insufficient, explicitly say you could not find relevant excerpts in the indexed documents.',
          '',
          'Document context:',
          contextBlock,
        ].join('\n'),
      });
    } else if (contextBlock === '__PERMISSION_DENIED__') {
      history.push({
        role: 'system',
        content: [
          'The relevant information exists in documents the current user does NOT have permission to access.',
          'Respond with a short permission notice: the user does not have permission for this information and should contact someone with the required permission.',
          'Do NOT reveal or summarize restricted content.',
        ].join('\n'),
      });
    } else {
      history.push({
        role: 'system',
        content: [
          'No relevant document excerpts were retrieved for this question.',
          'Do NOT say you do not have access. Instead, say you could not find relevant excerpts in the indexed documents, then answer from general knowledge.',
        ].join('\n'),
      });
    }
    history.push({ role: 'user', content: question });

    // Call Ollama
    let aiText;
    try {
      aiText = await callOllama(history);
    } catch (apiErr) {
      console.error('Ollama error:', apiErr.message);
      aiText = `Sorry, I'm unable to respond right now. (${apiErr.message})`;
    }
    aiText = toPlainText(aiText);

    // Save AI reply
    const aiMessage = await prisma.chatMessage.create({
      data: { sessionId, role: 'ai', text: aiText },
    });

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({
      userMessage: formatMessage(userMessage),
      aiMessage: formatMessage(aiMessage),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteSession = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  if (isNaN(sessionId)) return res.status(400).json({ message: 'Invalid session ID' });

  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: req.user.id },
    });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.renameSession = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  if (isNaN(sessionId)) return res.status(400).json({ message: 'Invalid session ID' });

  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) return res.status(400).json({ message: 'title is required' });
  if (title.length > 120) return res.status(400).json({ message: 'title must be 120 characters or fewer' });

  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: req.user.id },
    });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const updated = await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title, updatedAt: new Date() },
    });

    res.json({
      session: {
        id: updated.id,
        title: updated.title,
        time: formatRelativeTime(updated.updatedAt),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

function formatMessage(m) {
  return {
    id: m.id,
    role: m.role,
    text: m.text,
    time: new Date(m.createdAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
}

function formatRelativeTime(date) {
  const now = new Date();
  const d = new Date(date);
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
