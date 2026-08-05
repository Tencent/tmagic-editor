import fs from 'fs-extra';
import ts from 'typescript';

import { require } from '../require';

/**
 * Transform a ts file to cjs code
 */
export const transformTsFileToCodeSync = (filename: string): string =>
  ts.transpileModule(fs.readFileSync(filename).toString(), {
    compilerOptions: {
      inlineSourceMap: true,
      inlineSources: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;

/**
 * Globally allow ts files to be loaded via `require()`
 */
export const allowTs = (): void => {
  require.extensions['.ts'] = (m: any, filename: string) => {
    m._compile(transformTsFileToCodeSync(filename), filename);
  };
};
