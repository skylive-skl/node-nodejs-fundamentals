import { Transform } from 'node:stream';

const lineNumberer = () => {
  let lineCount = 1;

  const transformStream = new Transform({
    transform(chunk, _, callback) {
      if (this.buffer === undefined) {
        this.buffer = '';
      }

      this.buffer += chunk.toString();

      let newlineIndex;
      while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
        const line = this.buffer.slice(0, newlineIndex);
        this.push(`${lineCount} | ${line}\n`);
        lineCount++;
        this.buffer = this.buffer.slice(newlineIndex + 1);
      }

      callback();
    },
    flush(callback) {
      if (this.buffer !== undefined && this.buffer.length > 0) {
        this.push(`${lineCount} | ${this.buffer}`);
      }
      callback();
    }
  });

  process.stdin.pipe(transformStream).pipe(process.stdout);
};

lineNumberer();
