import { parentPort } from 'node:worker_threads';

parentPort.on('message', (data) => {
  const sorted = [...data].sort((a, b) => a - b);
  parentPort.postMessage(sorted);
});
