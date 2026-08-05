import { builtinModules, createRequire } from 'node:module';

import { defineConfig } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';

const require = createRequire(import.meta.url);
const packageJson = require('./package.json');
const externalPackages = new Set([
  ...builtinModules,
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
]);

export default defineConfig({
  input: 'src/index.ts',
  plugins: [dts()],
  external: (id) => {
    if (id.startsWith('node:') || externalPackages.has(id)) {
      return true;
    }

    for (const packageName of externalPackages) {
      if (id.startsWith(`${packageName}/`)) {
        return true;
      }
    }

    return false;
  },
  output: {
    dir: 'lib',
    format: 'es',
    sourcemap: false,
  },
  codeSplitting: false,
});
