import execa from 'execa';
import minimist from 'minimist';

const { type } = minimist(process.argv.slice(2));

const run = (bin, args, opts = {}) => execa(bin, args, { stdio: 'inherit', ...opts });

const main = async () => {
  // 按照依赖顺序构建
  const packages = [
    'schema',
    'utils',
    'dep',
    'data-source',
    'core',
    'design',
    'element-plus-adapter',
    'tdesign-vue-next-adapter',
    'form',
    'table',
    'stage',
    'editor',
    'cli',
    'ui',
  ];

  for (const pkg of packages) {
    await run('pnpm', ['--filter', `@tmagic/${pkg}`, type ? 'build:type' : 'build']);
  }
};

main();
