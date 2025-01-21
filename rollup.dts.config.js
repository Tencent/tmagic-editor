import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import alias from '@rollup/plugin-alias';
import dts from 'rollup-plugin-dts';

if (!existsSync('temp')) {
  console.warn(
    'no temp dts files found. run `tsc -p tsconfig.build-browser.json && vue-tsc --declaration --emitDeclarationOnly --project tsconfig.build-vue.json` first.',
  );
  process.exit(1);
}

removeScss('temp/packages/editor/src/index.d.ts');
removeScss('temp/packages/form/src/index.d.ts');
removeScss('temp/packages/design/src/index.d.ts');
removeScss('temp/packages/table/src/index.d.ts');

const packages = readdirSync('temp/packages');
const runtimes = readdirSync('temp/runtime');
const targets = process.env.TARGETS ? process.env.TARGETS.split(',') : null;
const targetPackages = targets ? packages.filter((pkg) => targets.includes(pkg)) : packages;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function rollupConfig(pkg, base) {
  return {
    input: `./temp/${base}/${pkg}/src/index.d.ts`,
    output: {
      file: `${base}/${pkg}/types/index.d.ts`,
      format: 'es',
    },
    plugins: [
      alias({
        entries: [
          { find: /^@form/, replacement: path.join(__dirname, `./temp/packages/form/src`) },
          { find: /^@editor/, replacement: path.join(__dirname, `./temp/packages/editor/src`) },
          { find: /^@data-source/, replacement: path.join(__dirname, `./temp/packages/data-source/src`) },
        ],
      }),
      dts(),
    ],
    onwarn(warning, warn) {
      // during dts rollup, everything is externalized by default
      if (warning.code === 'UNRESOLVED_IMPORT' && !warning.exporter?.startsWith('.')) {
        return;
      }
      warn(warning);
    },
  };
}

export default [
  ...targetPackages.map((pkg) => rollupConfig(pkg, 'packages')),
  ...runtimes.map((pkg) => rollupConfig(pkg, 'runtime')),
];

function removeScss(path) {
  writeFileSync(path, readFileSync(path).toString().replace(`import './theme/index.scss';`, ''));
}
