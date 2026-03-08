import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';

const verify = async () => {
  const dirFiles = join(import.meta.dirname, 'files');
  const checksumsPath = join(dirFiles, 'checksums.json');

  let checksumData;
  try {
    const fileContent = await readFile(checksumsPath, 'utf8');
    checksumData = JSON.parse(fileContent);
  } catch (err) {
    throw new Error('FS operation failed');
  }

  for (const [filename, expectedHash] of Object.entries(checksumData)) {
    const filePath = join(dirFiles, filename);
    const hash = createHash('sha256');

    try {
      await pipeline(
        createReadStream(filePath),
        hash
      );
      const actualHash = hash.digest('hex');
      if (actualHash === expectedHash) {
        console.log(`${filename} — OK`);
      } else {
        console.log(`${filename} — FAIL`);
      }
    } catch (err) {
      console.log(`${filename} — FAIL`);
    }
  }
};

await verify();
