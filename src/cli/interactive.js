import readline from 'node:readline';

const interactive = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  const commands = {
    uptime: () => console.log(`Uptime: ${process.uptime().toFixed(2)}s`),
    cwd: () => console.log(process.cwd()),
    date: () => console.log(new Date().toISOString()),
    exit: () => rl.close(),
  }

  rl.prompt();

  rl.on('line', (line) => {
    const command = line.trim();
    if (commands[command]) {
      commands[command]();
    } else {
      console.log('Unknown command');
    }
    if (command !== 'exit') {
      rl.prompt();
    }
  });

  rl.on('close', () => {
    console.log('Goodbye!');
    process.exit(0);
  });

  rl.on('SIGINT', () => {
    rl.close();
  });
};

interactive();
