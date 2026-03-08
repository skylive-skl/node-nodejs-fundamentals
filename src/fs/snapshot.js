import { resolve, dirname, join, relative } from 'node:path';
import { stat, readdir, readFile, writeFile } from 'node:fs/promises';

const rootPath = resolve(import.meta.dirname, '..', 'workspace').replace(/\\/g, '/');
const snapshotJsonPath = join(dirname(rootPath), 'snapshot.json').replace(/\\/g, '/');

const snapshot = async () => {
  try {
    const stats = await stat(rootPath);
    if (!stats.isDirectory()) {
      throw new Error('Not a directory');
    }
  } catch (error) {
    throw new Error('FS operation failed');
  }

  const entries = [];

  const scanDir = async (currentPath) => {
    const items = await readdir(currentPath, { withFileTypes: true });
    const itemPromises = items.map(async item => {
      const fullPath = join(currentPath, item.name);
      const normalizedPath = relative(rootPath, fullPath).replace(/\\/g, '/');
      if (item.isDirectory()) {
        entries.push({
          path: normalizedPath,
          type: 'directory'
        });
        await scanDir(fullPath);
      } else if (item.isFile()) {
        const itemStats = await stat(fullPath);
        const content = await readFile(fullPath, 'base64');
        entries.push({
          path: normalizedPath,
          type: 'file',
          size: itemStats.size,
          content
        });
      }
    });

    await Promise.all(itemPromises);
  };

  await scanDir(rootPath);

  const data = {
    rootPath,
    entries
  };

  await writeFile(snapshotJsonPath, JSON.stringify(data, null, 2), 'utf8');
};

await snapshot();
