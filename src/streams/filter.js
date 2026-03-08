import { Transform } from 'node:stream';
import { EOL } from 'node:os';
import { parseArgs } from 'node:util';

const filter = () => {
  let pattern;

  try {
    const { values } = parseArgs({
      options: { pattern: { type: 'string' } },
    });
    pattern = values.pattern;
    if (!pattern) throw new Error('Missing pattern');
  } catch (error) {
    console.error('Error: --pattern argument is required');
    process.exit(1);
  }

  let remainder = '';

  process.stdin.setEncoding('utf8');

  const filterStream = new Transform({
    transform(chunk, _, callback) {
      const parts = (remainder + chunk).split(/\r?\n/);
      remainder = parts.pop() || '';

      for (const line of parts) {
        if (line.includes(pattern)) {
          this.push(line + EOL);
        }
      }
      callback();
    },
    flush(callback) {
      if (remainder && remainder.includes(pattern)) {
        this.push(remainder + EOL);
      }
      callback();
    }
  });

  process.stdin.pipe(filterStream).pipe(process.stdout);
};

filter();
