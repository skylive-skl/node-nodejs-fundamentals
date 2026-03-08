import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createReadStream, createWriteStream } from 'node:fs';
import { stat, mkdir } from 'node:fs/promises';
import { createBrotliDecompress } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { once } from 'node:events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const decompressDir = async () => {
  const sourceFile = join(__dirname, 'workspace', 'compressed', 'archive.br');
  const destDir = join(__dirname, 'workspace', 'decompressed');

  try {
    await stat(sourceFile);
  } catch {
    throw new Error('FS operation failed');
  }

  await mkdir(destDir, { recursive: true });

  const extractStream = async (source) => {
    const asyncIterator = source[Symbol.asyncIterator]();
    let buffer = Buffer.alloc(0);

    async function readExact(size) {
      while (buffer.length < size) {
        const { value, done } = await asyncIterator.next();
        if (done) return null;
        buffer = Buffer.concat([buffer, value]);
      }
      const chunk = buffer.subarray(0, size);
      buffer = buffer.subarray(size);
      return chunk;
    }

    while (true) {
      const lenBuf = await readExact(4);
      if (!lenBuf) break;

      const metaLen = lenBuf.readUInt32LE(0);
      const metaBuf = await readExact(metaLen);
      const metadataStr = metaBuf.toString('utf8');
      const metadata = JSON.parse(metadataStr);

      const fullPath = join(destDir, metadata.path);

      if (metadata.type === 'directory') {
        await mkdir(fullPath, { recursive: true });
      } else if (metadata.type === 'file') {
        await mkdir(dirname(fullPath), { recursive: true });

        const dst = createWriteStream(fullPath);
        let remaining = metadata.size;

        while (remaining > 0) {
          if (buffer.length === 0) {
            const { value, done } = await asyncIterator.next();
            if (done) throw new Error('Unexpected EOF inside file');
            buffer = value;
          }

          const toWrite = Math.min(buffer.length, remaining);
          const chunk = buffer.subarray(0, toWrite);

          if (!dst.write(chunk)) {
            await once(dst, 'drain');
          }

          buffer = buffer.subarray(toWrite);
          remaining -= toWrite;
        }

        dst.end();
        await once(dst, 'finish');
      }
    }
  };

  const readStream = createReadStream(sourceFile);
  const brotli = createBrotliDecompress();

  await pipeline(readStream, brotli, extractStream);
};

await decompressDir();
