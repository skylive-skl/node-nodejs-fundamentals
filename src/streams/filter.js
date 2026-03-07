import { Transform } from 'stream';
import { EOL } from 'os';

const filter = () => {
  const args = process.argv.slice(2);
  const patternIndex = args.indexOf('--pattern');

  if (patternIndex === -1 || patternIndex === args.length - 1) {
    console.error('Error: --pattern argument is required');
    process.exit(1);
  }

  const pattern = args[patternIndex + 1];
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
