import execa from 'execa';
import minimist from 'minimist';

const { type } = minimist(process.argv.slice(2));

const run = (bin, args, opts = {}) => execa(bin, args, { stdio: 'inherit', ...opts });

const build = (pkg) => run('pnpm', ['--filter', `@tmagic/${pkg}`, type ? 'build:type' : 'build']);

const main = async () => {
  // 按照依赖顺序构建
  build('cli');

  await Promise.all([
    (async () => {
      for (const pkg of ['schema', 'utils', 'dep', 'data-source', 'core', 'stage']) {
        await build(pkg);
      }
    })(),
    (async () => {
      for (const pkg of ['design', 'element-plus-adapter', 'tdesign-vue-next-adapter']) {
        await build(pkg);
      }
    })(),
  ]);

  for (const pkg of ['form', 'table', 'editor', 'vue-runtime-help', 'tmagic-form-runtime', 'ui']) {
    await build(pkg);
  }
};

main();
