import * as recast from 'recast';

import type App from '../Core';
import { EntryType } from '../types';

export const prepareEntryFile = async (app: App) => {
  const { moduleMainFilePath, options } = app;
  const { componentFileAffix, dynamicImport, hooks, useTs = true } = options;

  let contentMap: Record<string, string> = {
    'comp-entry': generateContent(useTs, EntryType.COMPONENT, moduleMainFilePath.componentMap, componentFileAffix),
    'async-comp-entry': generateContent(
      useTs,
      EntryType.COMPONENT,
      moduleMainFilePath.componentMap,
      componentFileAffix,
      dynamicImport,
    ),
    'plugin-entry': generateContent(useTs, EntryType.PLUGIN, moduleMainFilePath.pluginMap),
    'async-plugin-entry': generateContent(useTs, EntryType.PLUGIN, moduleMainFilePath.pluginMap, '', dynamicImport),
    'config-entry': generateContent(useTs, EntryType.CONFIG, moduleMainFilePath.configMap),
    'value-entry': generateContent(useTs, EntryType.VALUE, moduleMainFilePath.valueMap),
    'event-entry': generateContent(useTs, EntryType.EVENT, moduleMainFilePath.eventMap),
    'datasource-entry': generateContent(useTs, EntryType.DATASOURCE, moduleMainFilePath.datasourceMap),
    'async-datasource-entry': generateContent(
      useTs,
      EntryType.DATASOURCE,
      moduleMainFilePath.datasourceMap,
      '',
      dynamicImport,
    ),
    'ds-config-entry': generateContent(useTs, EntryType.DS_CONFIG, moduleMainFilePath.dsConfigMap),
    'ds-value-entry': generateContent(useTs, EntryType.DS_VALUE, moduleMainFilePath.dsValueMap),
    'ds-event-entry': generateContent(useTs, EntryType.DS_EVENT, moduleMainFilePath.dsEventMap),
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
      app.writeTemp(`${file}.d.ts`, `const type: Record<string, any>;\n\nexport default type;`);
    }
    app.writeTemp(fileName, content);
  });
};

export const generateContent = (
  useTs: boolean,
  type: EntryType,
  map: Record<string, string> = {},
  componentFileAffix = '',
  dynamicImport = false,
) => {
  const list: string[] = [];
  const importDeclarations: string[] = [];

  Object.entries(map).forEach(([key, packagePath]) => {
    const name = makeCamelCase(key);
    if (dynamicImport) {
      list.push(
        `'${key}': () => import('${packagePath}${packagePath.endsWith(componentFileAffix) ? '' : componentFileAffix}')`,
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
    const ${exportToken}${useTs ? ': Record<string, any>' : ''} = {
      ${list.join(',')}
    }
    export default ${exportToken};
  `);
};

export const prettyCode = (code: string) =>
  recast.prettyPrint(recast.parse(code.replace(/\\/g, '/'), { parser: require('recast/parsers/typescript') }), {
    tabWidth: 2,
    trailingComma: true,
    quote: 'single',
  }).code;

export const makeCamelCase = function (name: string): string {
  if (typeof name !== 'string') {
    return '';
  }
  return name.replace(/-(\w)/g, ($0, $1) => $1.toUpperCase());
};
