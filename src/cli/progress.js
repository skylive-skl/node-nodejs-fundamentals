const progress = () => {
  const getArg = (name, def) => {
    const index = process.argv.indexOf(name);
    return index !== -1 ? process.argv[index + 1] : def;
  };

  const duration = Number(getArg('--duration', 5000));
  const interval = Number(getArg('--interval', 100));
  const length = Number(getArg('--length', 30));
  const color = getArg('--color', '');

  let colorStart = '';
  let colorEnd = '';
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    colorStart = `\x1b[38;2;${r};${g};${b}m`;
    colorEnd = '\x1b[0m';
  }

  let elapsed = 0;

  const draw = () => {
    const ratio = Math.min(elapsed / duration, 1);
    const filledCount = Math.round(ratio * length);

    const filled = colorStart + '█'.repeat(filledCount) + colorEnd;
    const empty = ' '.repeat(length - filledCount);

    process.stdout.write(`\r[${filled}${empty}] ${Math.round(ratio * 100)}%`);

    if (ratio >= 1) {
      clearInterval(timer);
      console.log('\nDone!');
    }
  };

  draw();

  const timer = setInterval(() => {
    elapsed += interval;
    draw();
  }, interval);
};

progress();
