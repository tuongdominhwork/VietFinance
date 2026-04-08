const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBED_MODEL = process.env.EMBED_MODEL || 'nomic-embed-text';

/**
 * Generate an embedding vector for a single string.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embed error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.embeddings[0];
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

module.exports = { embed, cosineSimilarity };
