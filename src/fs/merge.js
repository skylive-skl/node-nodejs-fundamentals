import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
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

    const promises = targetFiles.map(file => readFile(join(partsDir, file), 'utf8'));

    const files = await Promise.all(promises);

    let mergedContent = files.join('\n');

    await writeFile(mergedFile, mergedContent, 'utf8');

  } catch (error) {
    throw new Error('FS operation failed');
  }
};

await merge();
