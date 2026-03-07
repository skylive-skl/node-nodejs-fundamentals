import { readdir, stat } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { join } from 'node:path';

const merge = async () => {
  const partsDir = join(import.meta.dirname, '..', 'workspace', 'parts');
  const mergedFile = join(import.meta.dirname, '..', 'workspace', 'merged.txt');


  const args = process.argv.slice(2);
  let filesToMerge = null;

  const filesIndex = args.indexOf('--files');
  if (filesIndex !== -1) {
    filesToMerge = [];
    for (let i = filesIndex + 1; i < args.length; i++) {
      if (args[i].startsWith('--')) break;
      filesToMerge.push(args[i]);
    }

    if (filesToMerge.length === 0) {
      filesToMerge = null;
    }
  }

  try {
    const stats = await stat(partsDir);
    if (!stats.isDirectory()) {
      throw new Error('FS operation failed');
    }

    let targetFiles = [];

    if (filesToMerge) {
      targetFiles = filesToMerge;
    } else {
      const items = await readdir(partsDir);
      targetFiles = items.filter(file => file.endsWith('.txt')).sort();

      if (targetFiles.length === 0) {
        throw new Error('FS operation failed');
      }
    }

    async function* mergeGenerator() {
      for (let i = 0; i < targetFiles.length; i++) {
        const filePath = join(partsDir, targetFiles[i]);
        const readStream = createReadStream(filePath, { encoding: 'utf8' });

        for await (const chunk of readStream) {
          yield chunk;
        }

        if (i < targetFiles.length - 1) {
          yield '\n';
        }
      }
    }

    await pipeline(
      mergeGenerator(),
      createWriteStream(mergedFile, { encoding: 'utf8' })
    );

  } catch (error) {
    throw new Error('FS operation failed');
  }
};

await merge();
