import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { createReadStream, createWriteStream } from 'node:fs';
import { stat, mkdir, readdir } from 'node:fs/promises';
import { createBrotliCompress } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compressDir = async () => {
  const sourceDir = join(__dirname, 'workspace', 'toCompress');
  const destDir = join(__dirname, 'workspace', 'compressed');
  const destFile = join(destDir, 'archive.br');

  try {
    await stat(sourceDir);
  } catch {
    throw new Error('FS operation failed');
  }

  await mkdir(destDir, { recursive: true });

  async function* generateArchiveStream() {
    async function* processPath(currentPath, baseDir) {
      let stats;
      try {
        stats = await stat(currentPath);
      } catch {
        return;
      }

      const relPath = relative(baseDir, currentPath).replace(/\\/g, '/');

      if (relPath !== '') {
        const metadata = {
          path: relPath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.isDirectory() ? 0 : stats.size,
        };
        const metaStr = JSON.stringify(metadata);
        const metaBuf = Buffer.from(metaStr, 'utf8');
        const lenBuf = Buffer.alloc(4);
        lenBuf.writeUInt32LE(metaBuf.length, 0);

        yield lenBuf;
        yield metaBuf;

        if (stats.isFile()) {
          const readStream = createReadStream(currentPath);
          for await (const chunk of readStream) {
            yield chunk;
          }
        }
      }

      if (stats.isDirectory()) {
        const entries = await readdir(currentPath);
        for (const entry of entries) {
          yield* processPath(join(currentPath, entry), baseDir);
        }
      }
    }

    yield* processPath(sourceDir, sourceDir);
  }

  const archiveStream = Readable.from(generateArchiveStream());
  const brotli = createBrotliCompress();
  const writeStream = createWriteStream(destFile);

  await pipeline(archiveStream, brotli, writeStream);
};

await compressDir();
