import * as recast from 'recast';

import type App from '../Core';
import { EntryType } from '../types';

export const prepareEntryFile = async (app: App) => {
  const { moduleMainFilePath, options } = app;
  const { dynamicImport, dynamicIgnore, hooks, useTs = true } = options;

  let contentMap: Record<string, string> = {
    'comp-entry': generateContent(
      useTs,
      EntryType.COMPONENT,
      moduleMainFilePath.componentPackage,
      moduleMainFilePath.componentMap,
    ),
    'async-comp-entry': generateContent(
      useTs,
      EntryType.COMPONENT,
      moduleMainFilePath.componentPackage,
      moduleMainFilePath.componentMap,
      dynamicImport,
      dynamicIgnore,
    ),
    'plugin-entry': generateContent(
      useTs,
      EntryType.PLUGIN,
      moduleMainFilePath.pluginPakcage,
      moduleMainFilePath.pluginMap,
    ),
    'async-plugin-entry': generateContent(
      useTs,
      EntryType.PLUGIN,
      moduleMainFilePath.pluginPakcage,
      moduleMainFilePath.pluginMap,
      dynamicImport,
    ),
    'config-entry': generateContent(
      useTs,
      EntryType.CONFIG,
      moduleMainFilePath.componentPackage,
      moduleMainFilePath.configMap,
    ),
    'value-entry': generateContent(
      useTs,
      EntryType.VALUE,
      moduleMainFilePath.componentPackage,
      moduleMainFilePath.valueMap,
    ),
    'event-entry': generateContent(
      useTs,
      EntryType.EVENT,
      moduleMainFilePath.componentPackage,
      moduleMainFilePath.eventMap,
    ),
    'datasource-entry': generateContent(
      useTs,
      EntryType.DATASOURCE,
      moduleMainFilePath.datasourcePackage,
      moduleMainFilePath.datasourceMap,
    ),
    'async-datasource-entry': generateContent(
      useTs,
      EntryType.DATASOURCE,
      moduleMainFilePath.datasourcePackage,
      moduleMainFilePath.datasourceMap,
      dynamicImport,
    ),
    'ds-config-entry': generateContent(
      useTs,
      EntryType.DS_CONFIG,
      moduleMainFilePath.datasourcePackage,
      moduleMainFilePath.dsConfigMap,
    ),
    'ds-value-entry': generateContent(
      useTs,
      EntryType.DS_VALUE,
      moduleMainFilePath.datasourcePackage,
      moduleMainFilePath.dsValueMap,
    ),
    'ds-event-entry': generateContent(
      useTs,
      EntryType.DS_EVENT,
      moduleMainFilePath.datasourcePackage,
      moduleMainFilePath.dsEventMap,
    ),
  };

  if (typeof hooks?.beforeWriteEntry === 'function') {
    contentMap = await hooks.beforeWriteEntry(contentMap, app);
  }

  Object.entries(contentMap).forEach(([file, content]) => {
    let fileName = `${file}.ts`;
    if (useTs) {
      app.writeTemp(fileName, content);
    } else {
      fileName = `${file}.js`;
      app.writeTemp(`${file}.d.ts`, 'const type: Record<string, any>;\n\nexport default type;');
    }
    app.writeTemp(fileName, content);
  });
};

export const generateContent = (
  useTs: boolean,
  type: EntryType,
  packageMap: Record<string, string> = {},
  map: Record<string, string> = {},
  dynamicImport = false,
  dynamicIgnore: string[] = [],
) => {
  const list: string[] = [];
  const importDeclarations: string[] = [];

  Object.entries(map).forEach(([key, packagePath]) => {
    const name = makeCamelCase(key);

    if ([EntryType.CONFIG, EntryType.EVENT, EntryType.VALUE].includes(type) && packagePath === packageMap[key]) {
      importDeclarations.push(`import { ${type} as ${name} } from '${packageMap[key]}'`);
      list.push(`'${key}': ${name}`);
    } else if (dynamicImport && !dynamicIgnore.includes(key)) {
      list.push(`'${key}': () => import('${packagePath}')`);
    } else {
      importDeclarations.push(`import ${name} from '${packagePath}'`);
      list.push(`'${key}': ${name}`);
    }
  });

  const exportToken = `${type}s`;

  return prettyCode(`${importDeclarations.join(';')}
    const ${exportToken}${useTs ? ': Record<string, any>' : ''} = {
      ${list.join(',')}
    }
    export default ${exportToken};
  `);
};

export const prettyCode = (code: string) =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  recast.prettyPrint(recast.parse(code.replace(/\\/g, '/'), { parser: require('recast/parsers/typescript') }), {
    tabWidth: 2,
    trailingComma: true,
    quote: 'single',
  }).code;

export const makeCamelCase = function (name: string): string {
  if (typeof name !== 'string') {
    return '';
  }
  return name.replace(/-(\w)/g, (_$0, $1) => $1.toUpperCase());
};
