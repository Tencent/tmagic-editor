import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { dts } from 'rolldown-plugin-dts';

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

const dirname = path.dirname(fileURLToPath(import.meta.url));

const aliasEntries = [
  { find: /^@form\//, replacement: `${path.join(dirname, './temp/packages/form/src')}/` },
  { find: /^@editor\//, replacement: `${path.join(dirname, './temp/packages/editor/src')}/` },
  { find: /^@data-source\//, replacement: `${path.join(dirname, './temp/packages/data-source/src')}/` },
];

function aliasPlugin() {
  return {
    name: 'dts-alias',
    resolveId(source) {
      for (const { find, replacement } of aliasEntries) {
        if (find.test(source)) {
          let resolved = source.replace(find, replacement);
          resolved = resolved.replace(/\/\//g, '/');
          resolved = resolved.replace(/\.js$/, '');
          if (existsSync(`${resolved}.d.ts`)) {
            return `${resolved}.d.ts`;
          }
          if (existsSync(resolved)) {
            return resolved;
          }
          return `${resolved}.d.ts`;
        }
      }
    },
  };
}

function rolldownConfig(pkg, base) {
  return {
    input: `./temp/${base}/${pkg}/src/index.d.ts`,
    external: (id) =>
      !id.startsWith('.') &&
      !id.startsWith('/') &&
      !id.startsWith('@editor/') &&
      !id.startsWith('@form/') &&
      !id.startsWith('@data-source/'),
    plugins: [aliasPlugin(), ...dts({ dtsInput: true, tsconfig: false })],
    output: {
      file: `${base}/${pkg}/types/index.d.ts`,
      format: 'es',
    },
  };
}

export default [
  ...targetPackages.map((pkg) => rolldownConfig(pkg, 'packages')),
  ...runtimes.map((pkg) => rolldownConfig(pkg, 'runtime')),
];

function removeScss(path) {
  writeFileSync(path, readFileSync(path).toString().replace("import './theme/index.scss';", ''));
}
