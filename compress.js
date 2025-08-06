import fs from 'fs';
import zstd from '@mongodb-js/zstd';

async function compressFile() {
  try {
    const input = fs.readFileSync('src/books_base.jsonl');
    const compressed = await zstd.compress(input);
    fs.writeFileSync('src/books_base.jsonl.zst', compressed);
    console.log('File compressed successfully to books_base.jsonl.zst');
  } catch (error) {
    console.error('Error compressing file:', error);
  }
}

compressFile();
