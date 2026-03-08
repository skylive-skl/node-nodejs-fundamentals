import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EOL } from 'node:os';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, constants } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { once } from 'node:events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const split = async () => {
  const {
    values: { lines },
  } = parseArgs({
    options: {
      lines: {
        type: 'string',
        default: '10',
      },
    },
  });

  const parsedLines = parseInt(lines, 10);
  const maxLines = !isNaN(parsedLines) && parsedLines > 0 ? parsedLines : 10;

  const sourcePath = join(__dirname, 'source.txt');
  let currentChunk = 1;
  let currentLineCount = 0;
  let writeStream = null;

  try {
    await access(sourcePath, constants.F_OK);
  } catch (err) {
    console.error(`Error: source.txt does not exist at ${sourcePath}`);
    return;
  }

  const getWriteStream = () => {
    if (!writeStream) {
      writeStream = createWriteStream(join(__dirname, `chunk_${currentChunk}.txt`));
      writeStream.once('error', (err) => {
        console.error('Write stream error:', err.message);
      });
    }
    return writeStream;
  };

  const readStream = createReadStream(sourcePath, { encoding: 'utf8' });
  let remainder = '';

  try {
    for await (const chunk of readStream) {
      const parts = (remainder + chunk).split(/\r?\n/);
      remainder = parts.pop();

      for (let i = 0; i < parts.length; i++) {
        const stream = getWriteStream();

        const canWrite = stream.write(parts[i] + EOL);
        if (!canWrite) {
          await once(stream, 'drain');
        }

        currentLineCount++;
        if (currentLineCount >= maxLines) {
          stream.end();
          await once(stream, 'finish');
          writeStream = null;
          currentChunk++;
          currentLineCount = 0;
        }
      }
    }

    if (remainder) {
      const stream = getWriteStream();
      stream.end(remainder + EOL);
    } else if (writeStream) {
      writeStream.end();
    }
  } catch (error) {
    console.error('FS operation failed or stream processing error:', error.message);
  }
};

await split();
