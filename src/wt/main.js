import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const main = async () => {
  const cores = cpus().length;
  const dataPath = join(__dirname, 'data.json');
  const data = JSON.parse(await readFile(dataPath, 'utf-8'));

  const chunkSize = Math.ceil(data.length / cores);
  const chunks = [];
  for (let i = 0; i < cores; i++) {
    const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
    chunks.push(chunk);
  }

  const workerFile = join(__dirname, 'worker.js');
  const workers = chunks.map((chunk) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerFile);
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });
      worker.postMessage(chunk);
    });
  });

  const sortedChunks = await Promise.all(workers);

  const finalSortedArray = [];
  const pointers = new Array(cores).fill(0);

  while (true) {
    let minVal = Infinity;
    let minIndex = -1;

    for (let i = 0; i < cores; i++) {
      if (pointers[i] < sortedChunks[i].length) {
        if (sortedChunks[i][pointers[i]] < minVal) {
          minVal = sortedChunks[i][pointers[i]];
          minIndex = i;
        }
      }
    }

    if (minIndex === -1) {
      break;
    }

    finalSortedArray.push(minVal);
    pointers[minIndex]++;
  }

  console.log(finalSortedArray);
};

await main();
