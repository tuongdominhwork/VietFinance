const prisma = require('../config/db');
const { embed, cosineSimilarity } = require('./embedder');

/**
 * Find the top-k most relevant document chunks for a query.
 * @param {string} query
 * @param {object} opts
 * @param {number} [opts.topK=5]
 * @param {number} [opts.minScore=0.3]
 * @returns {Promise<Array<{ text: string, score: number, documentId: number, documentName: string }>>}
 */
async function searchChunks(query, { topK = 5, minScore = 0.3 } = {}) {
  const queryVec = await embed(query);

  const chunks = await prisma.documentChunk.findMany({
    include: { document: { select: { id: true, name: true } } },
  });

  const scored = chunks.map(chunk => ({
    text: chunk.text,
    documentId: chunk.document.id,
    documentName: chunk.document.name,
    score: cosineSimilarity(queryVec, JSON.parse(chunk.embedding)),
  }));

  return scored
    .filter(c => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

module.exports = { searchChunks };
