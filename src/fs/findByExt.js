import { resolve, relative } from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { parseArgs } from 'node:util';

const findByExt = async () => {
  const { values } = parseArgs({
    options: {
      ext: {
        type: 'string',
        default: 'txt',
      },
    },
  });

  let ext = values.ext;

  if (!ext.startsWith('.')) {
    ext = "." + ext;
  }

  const rootPath = resolve(import.meta.dirname, '..', 'workspace');

  try {
    const stats = await stat(rootPath);
    if (!stats.isDirectory()) {
      throw new Error('Not a directory');
    }
  } catch (error) {
    throw new Error('FS operation failed');
  }

  const results = [];
  const scanDir = async (currentPath) => {
    const items = await readdir(currentPath, { withFileTypes: true });

    const itemPromises = items.map(async item => {
      const fullPath = resolve(currentPath, item.name);
      if (item.isDirectory()) {
        await scanDir(fullPath);
      } else if (item.isFile() && item.name.endsWith(ext)) {
        const normalizedPath = relative(rootPath, fullPath).replace(/\\/g, '/');
        results.push(normalizedPath);
      }
    })

    await Promise.all(itemPromises)
  };

  await scanDir(rootPath);

  results.sort();
  for (const filePath of results) {
    console.log(filePath);
  }
};

await findByExt();
