import fs from 'fs';
import path from 'path';
import { SAMPLE_DOCUMENTS } from '../src/data/sampleDocuments';

const outDir = path.resolve('public/sample_docs');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

for (const doc of SAMPLE_DOCUMENTS) {
  const filePath = path.join(outDir, doc.fileName);
  fs.writeFileSync(filePath, doc.content, 'utf8');
  console.log(`Wrote ${filePath}`);
}

console.log(`Successfully exported all ${SAMPLE_DOCUMENTS.length} clinical markdown documents.`);
