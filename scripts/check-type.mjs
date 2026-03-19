import { spawn } from 'node:child_process';

const commands = [
  ['tsc', ['--incremental', '--noEmit', '-p', 'tsconfig.check.json']],
  ['vue-tsc', ['--incremental', '--noEmit', '-p', 'tsconfig.check-vue.json']],
];

const results = await Promise.allSettled(
  commands.map(
    ([cmd, args]) =>
      new Promise((resolve, reject) => {
        const p = spawn(cmd, args, { stdio: 'inherit', shell: true });
        p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`))));
      }),
  ),
);

const failed = results.filter((r) => r.status === 'rejected');
if (failed.length > 0) {
  for (const f of failed) console.error(f.reason?.message);
  process.exit(1);
}
