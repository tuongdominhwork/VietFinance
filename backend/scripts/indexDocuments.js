require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const prisma = require('../config/db');
const { embed } = require('../services/embedder');
const { chunkText } = require('../services/chunker');

async function indexDocuments() {
  const documents = await prisma.document.findMany({
    where: { filePath: { not: null } },
  });

  if (documents.length === 0) {
    console.log('No documents with files found.');
    return;
  }

  console.log(`Indexing ${documents.length} documents...\n`);

  let totalChunks = 0;
  let skipped = 0;

  for (const doc of documents) {
    const filePath = path.join(__dirname, '..', doc.filePath);

    if (!fs.existsSync(filePath)) {
      console.warn(`  [skip] ${doc.name} — file not found at ${filePath}`);
      skipped++;
      continue;
    }

    // Clear existing chunks for this document
    await prisma.documentChunk.deleteMany({ where: { documentId: doc.id } });

    let text = '';
    try {
      const buffer = fs.readFileSync(filePath);
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } catch (err) {
      console.warn(`  [skip] ${doc.name} — failed to parse: ${err.message}`);
      skipped++;
      continue;
    }

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      console.warn(`  [skip] ${doc.name} — no text extracted`);
      skipped++;
      continue;
    }

    process.stdout.write(`  ${doc.name} (${chunks.length} chunks) `);

    for (let i = 0; i < chunks.length; i++) {
      const embedInput = `Document: ${doc.name}\n\n${chunks[i]}`;
      const embedding = await embed(embedInput);
      await prisma.documentChunk.create({
        data: {
          documentId: doc.id,
          chunkIndex: i,
          text: chunks[i],
          embedding: JSON.stringify(embedding),
        },
      });
      process.stdout.write('.');
    }

    console.log(' done');
    totalChunks += chunks.length;
  }

  console.log(`\nIndexing complete. ${totalChunks} chunks stored. ${skipped} documents skipped.`);
  await prisma.$disconnect();
}

indexDocuments().catch(err => {
  console.error('Indexing failed:', err);
  process.exit(1);
});
