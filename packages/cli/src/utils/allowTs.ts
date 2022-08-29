import { transformSync } from 'esbuild';
import fs from 'fs-extra';

/**
 * Transform a ts file to cjs code
 */
export const transformTsFileToCodeSync = (filename: string): string =>
  transformSync(fs.readFileSync(filename).toString(), {
    format: 'cjs',
    loader: 'ts',
    sourcefile: filename,
    sourcemap: 'inline',
    target: 'node14',
  }).code;

/**
 * Globally allow ts files to be loaded via `require()`
 */
export const allowTs = (): void => {
  require.extensions['.ts'] = (m: any, filename) => {
    m._compile(transformTsFileToCodeSync(filename), filename);
  };
};
