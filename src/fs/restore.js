import { resolve, dirname, join } from 'node:path';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const restorePath = resolve(import.meta.dirname, '..', 'workspace_restored').replace(/\\/g, '/');
const snapshotJsonPath = join(import.meta.dirname, '..', 'snapshot.json').replace(/\\/g, '/');

const restore = async () => {
  if (!existsSync(snapshotJsonPath)) {
    throw new Error(`FS operation failed: snapshot file not found: ${snapshotJsonPath}`);
  }

  if (existsSync(restorePath)) {
    throw new Error(`FS operation failed: restore path already exists: ${restorePath}`);
  }

  const data = JSON.parse(await readFile(snapshotJsonPath, 'utf8'));

  await mkdir(restorePath, { recursive: true });

  const dirPromises = data.entries.filter(entry => entry.type === 'directory')
    .map(entry => mkdir(join(restorePath, entry.path), { recursive: true }));

  await Promise.all(dirPromises);

  const filePromises = data.entries.filter(entry => entry.type === 'file')
    .map(entry => writeFile(join(restorePath, entry.path), entry.content, 'base64'));

  await Promise.all(filePromises);

};

await restore();
