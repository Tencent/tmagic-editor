import { createRequire } from 'node:module';

/**
 * CJS `require()` in an ESM context, shared by the whole CLI so that
 * `allowTs`'s `.ts` loader also applies to `loadUserConfig` requires.
 * Bound to the package `src/` directory, so paths like `../package.json`
 * resolve to the package root as before.
 */
export const require = createRequire(import.meta.url);
