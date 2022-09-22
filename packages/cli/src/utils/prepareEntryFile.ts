import * as recast from 'recast';

import type App from '../Core';
import { EntryType } from '../types';

export const prepareEntryFile = (app: App) => {
  const { componentMap = {}, pluginMap = {}, configMap = {}, valueMap = {}, eventMap = {} } = app.moduleMainFilePath;
  const { componentFileAffix, dynamicImport } = app.options;

  app.writeTemp('comp-entry.ts', generateContent(EntryType.COMPONENT, componentMap, componentFileAffix));
  app.writeTemp(
    'async-comp-entry.ts',
    generateContent(EntryType.COMPONENT, componentMap, componentFileAffix, dynamicImport),
  );

  app.writeTemp('plugin-entry.ts', generateContent(EntryType.PLUGIN, pluginMap));
  app.writeTemp('config-entry.ts', generateContent(EntryType.CONFIG, configMap));
  app.writeTemp('value-entry.ts', generateContent(EntryType.VALUE, valueMap));
  app.writeTemp('event-entry.ts', generateContent(EntryType.EVENT, eventMap));
};

const generateContent = (
  type: EntryType,
  map: Record<string, string>,
  componentFileAffix = '',
  dynamicImport = false,
) => {
  const list: string[] = [];
  const importDeclarations: string[] = [];

  Object.entries(map).forEach(([key, packagePath]) => {
    const name = makeCamelCase(key);
    if (dynamicImport) {
      list.push(
        `'${key}': import('${packagePath}${packagePath.endsWith(componentFileAffix) ? '' : componentFileAffix}')`,
      );
    } else {
      importDeclarations.push(
        `import ${name} from '${packagePath}${packagePath.endsWith(componentFileAffix) ? '' : componentFileAffix}'`,
      );
      list.push(`'${key}': ${name}`);
    }
  });

  const exportToken = `${type}s`;

  return prettyCode(`${importDeclarations.join(';')}
    const ${exportToken}: Record<string, any> = {
      ${list.join(',')}
    }
    export default ${exportToken};
  `);
};

const prettyCode = (code: string) =>
  recast.prettyPrint(recast.parse(code.replace(/\\/g, '/'), { parser: require('recast/parsers/typescript') }), {
    tabWidth: 2,
    trailingComma: true,
    quote: 'single',
  }).code;

const makeCamelCase = function (name: string): string {
  if (typeof name !== 'string') {
    return '';
  }
  return name.replace(/-(\w)/g, ($0, $1) => $1.toUpperCase());
};
