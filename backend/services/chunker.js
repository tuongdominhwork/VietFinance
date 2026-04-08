const CHUNK_SIZE = 1200;   // characters per chunk
const CHUNK_OVERLAP = 200; // overlap between consecutive chunks

/**
 * Split text into overlapping chunks.
 * Tries to split on paragraph/sentence boundaries within the target size.
 * @param {string} text
 * @returns {string[]}
 */
function chunkText(text) {
  // Normalise whitespace
  const clean = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (clean.length <= CHUNK_SIZE) return clean ? [clean] : [];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    let end = start + CHUNK_SIZE;

    if (end >= clean.length) {
      chunks.push(clean.slice(start).trim());
      break;
    }

    // Try to break on paragraph boundary
    let breakAt = clean.lastIndexOf('\n\n', end);
    if (breakAt <= start) {
      // Fall back to sentence boundary
      breakAt = clean.lastIndexOf('. ', end);
    }
    if (breakAt <= start) {
      // Fall back to word boundary
      breakAt = clean.lastIndexOf(' ', end);
    }
    if (breakAt <= start) {
      breakAt = end; // hard cut
    }

    chunks.push(clean.slice(start, breakAt).trim());
    start = breakAt - CHUNK_OVERLAP;
    if (start < 0) start = 0;
  }

  return chunks.filter(c => c.length > 50); // discard tiny fragments
}

module.exports = { chunkText };
