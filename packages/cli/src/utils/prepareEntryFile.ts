import * as recast from 'recast';

import type App from '../Core';
import { EntryType } from '../types';

export const prepareEntryFile = async (app: App) => {
  const { componentMap = {}, pluginMap = {}, configMap = {}, valueMap = {}, eventMap = {} } = app.moduleMainFilePath;
  const { componentFileAffix, dynamicImport, hooks } = app.options;
  let contentMap: Record<string, string> = {
    'comp-entry.ts': generateContent(EntryType.COMPONENT, componentMap, componentFileAffix),
    'async-comp-entry.ts': generateContent(EntryType.COMPONENT, componentMap, componentFileAffix, dynamicImport),
    'plugin-entry.ts': generateContent(EntryType.PLUGIN, pluginMap),
    'async-plugin-entry.ts': generateContent(EntryType.PLUGIN, pluginMap, '', dynamicImport),
    'config-entry.ts': generateContent(EntryType.CONFIG, configMap),
    'value-entry.ts': generateContent(EntryType.VALUE, valueMap),
    'event-entry.ts': generateContent(EntryType.EVENT, eventMap),
  };

  if (typeof hooks?.beforeWriteEntry === 'function') {
    contentMap = await hooks.beforeWriteEntry(contentMap, app);
  }

  Object.keys(contentMap).forEach((fileName: string) => {
    app.writeTemp(fileName, contentMap[fileName]);
  });
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
