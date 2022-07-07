/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { execSync } = require('child_process');
const { exit } = require('process');
const fs = require('fs');
const path = require('path');

const { parse, prettyPrint, types } = require('recast');
const n = types.namedTypes;

const pluginList = {};
let cwd = __dirname;
const pageRoot = () => path.resolve(cwd, '..');
const entryPath = () => path.resolve(pageRoot(), './src');
const defineTypes = {
  component: 'component',
  config: 'config',
  value: 'value',
  event: 'event',
};

const makeCamelCase = function (name) {
  if (typeof name !== 'string') {
    return '';
  }
  return name.replace(/-(\w)/g, ($0, $1) => $1.toUpperCase());
};

const parseEntry = function ({ ast, package, indexPath }) {
  if (!ast.program) {
    console.log(`${package} 入口文件不合法`);
    return exit(1);
  }

  const tokens = getASTTokenByTraverse({ ast, indexPath });
  let { config, value, event } = tokens;
  const { importComponentSource, importComponentToken } = tokens;

  if (!config) {
    console.log(`${package} ${defineTypes.config} 文件声明不合法`);
    return exit(1);
  }
  if (!value) {
    console.log(`${package} ${defineTypes.value} 文件声明不合法`);
    return exit(1);
  }
  if (!event) {
    // event 非必须，不需要 exit
    console.log(`${package} ${defineTypes.event} 文件声明缺失`);
  }

  const findIndex = importComponentToken.indexOf(exportDefaultToken);
  let component = '';
  if (findIndex > -1) {
    component = path.resolve(path.dirname(indexPath), importComponentSource[findIndex]);
  }

  if (!component) {
    console.log(`${package} ${defineTypes.component} 文件声明不合法`);
    return exit(1);
  }

  const reg = /^.*[/\\]node_modules[/\\](.*)/;
  [, config] = config.match(reg) || [, config];
  [, value] = value.match(reg) || [, value];
  [, component] = component.match(reg) || [, component];
  [, event] = event.match(reg) || [, event];

  return {
    config,
    value,
    component,
    event,
  };
};

const getASTTokenByTraverse = ({ ast, indexPath }) => {
  let config = '';
  let value = '';
  let event = '';
  const importComponentToken = [];
  const importComponentSource = [];

  types.visit(ast, {
    visitImportDeclaration(p) {
      const { node } = p;
      const { specifiers, source } = node;

      importComponentToken.push(specifiers[0].local.name);
      importComponentSource.push(source.value);

      this.traverse(p);
    },
    visitExportNamedDeclaration(p) {
      const { node } = p;
      const { specifiers, source } = node;
      const name = specifiers[0].exported.name.toLowerCase();

      if (name === defineTypes.value) {
        value = path.resolve(path.dirname(indexPath), source.value);
      } else if (name === defineTypes.config) {
        config = path.resolve(path.dirname(indexPath), source.value);
      } else if (name === defineTypes.event) {
        event = path.resolve(path.dirname(indexPath), source.value);
      }

      this.traverse(p);
    },
    visitExportDefaultDeclaration(p) {
      const { node } = p;
      const { declaration } = node;
      exportDefaultToken = declaration.name;
      this.traverse(p);
    },
  });

  return {
    config,
    value,
    event,
    importComponentToken,
    importComponentSource,
  };
};

const generateEntry = function ({ entries, type = 'build', componentFileAffix }) {
  const commonArgs = { entries, componentFileAffix };

  generateEntryFile({ entryFile: 'comp-entry.ts', type: defineTypes.component, ...commonArgs });
  if (type === 'build') {
    generateEntryFile({ entryFile: 'config-entry.ts', type: defineTypes.config, ...commonArgs });
    generateEntryFile({ entryFile: 'value-entry.ts', type: defineTypes.value, ...commonArgs });
    generateEntryFile({ entryFile: 'event-entry.ts', type: defineTypes.event, ...commonArgs });
  }
};

const generateEntryFile = function ({ entries, entryFile, type, componentFileAffix }) {
  const list = [];
  const importDeclarations = [];

  entries.forEach((entry) => {
    if (!entry.entry[type]) return;

    const name = makeCamelCase(entry.type);
    importDeclarations.push(
      `import ${name} from '${entry.entry[type]}${
        type === defineTypes.component && !entry.entry[type].includes(componentFileAffix) ? componentFileAffix : ''
      }'`,
    );
    list.push(`'${entry.type}': ${name}`);
  });

  const exportToken = `${type}s`;
  const capitalToken = exportToken.charAt(0).toUpperCase() + exportToken.slice(1);
  let jsString = '';
  let exportData = `window.magicPreset${capitalToken} = ${exportToken};`;

  if (type === defineTypes.component) {
    const pList = [];

    Object.keys(pluginList).forEach((pluginType) => {
      const name = makeCamelCase(pluginType);
      importDeclarations.push(`import ${name} from '${pluginList[pluginType]}'`);
      pList.push(`'${pluginType}': ${name}`);
    });

    exportData = `const plugins = {${pList.join(',')}};
      const entry = {${exportToken}, plugins};
      window.magicPreset${capitalToken} = entry;
      export default entry;`;

    jsString += `${importDeclarations.join(';')}
      const ${exportToken}: Record<string, any> = {
        ${list.join(',')}
      }
      ${exportData}`;
  } else {
    jsString += `${importDeclarations.join(';')}
      (function(){
        const ${exportToken}: Record<string, any> = {
          ${list.join(',')}
        }
        ${exportData}
      })()`;
  }

  fs.writeFileSync(
    path.resolve(entryPath(), entryFile),
    // window下需要将路径中\转换成/
    prettyPrint(parse(jsString.replace(/\\/g, '/'), { parser: require('recast/parsers/typescript') }), {
      tabWidth: 2,
      trailingComma: true,
      quote: 'single',
    }).code,
    { encoding: 'utf-8' },
  );
};

const installPackage = function (package) {
  try {
    // window下需要将路径中\转换成/
    execSync(`node -e "require.resolve('${package.replace(/\\/g, '/')}')"`, { stdio: 'ignore' });
  } catch (e) {
    execSync(`npm install ${package}`, {
      stdio: 'inherit',
      cwd: pageRoot(),
    });
  }
};

const getIndexPath = function (entry) {
  if (fs.lstatSync(entry).isFile()) {
    return entry;
  }

  if (fs.lstatSync(entry).isDirectory()) {
    const files = fs.readdirSync(entry);
    const [index] = files.filter((file) => file.split('.')[0] === 'index');

    return path.resolve(entry, index);
  }

  return entry;
};

const typeComponent = 1;
const typePlugin = 2;
const typeComponentPackage = 3;

const getComponentPackageImports = function ({ result, properties, indexPath, importDeclarations }) {
  result.type = typeComponentPackage;
  result.imports = [];

  properties.forEach((property) => {
    const [propertyMatch] = importDeclarations.filter((i) => {
      const [specifier] = i.specifiers;

      if (n.ImportDefaultSpecifier.check(specifier) && specifier.local.name === property.value.name) {
        return true;
      }

      return false;
    });

    if (propertyMatch) {
      result.imports.push({
        type: property.key.name,
        name: propertyMatch.specifiers[0].local.name,
        indexPath: getIndexPath(path.resolve(path.dirname(indexPath), propertyMatch.source.value)),
      });
    }
  });

  return result;
};

const isPlugin = function (properties) {
  const [match] = properties.filter((property) => property.key.name === 'install');

  return !!match;
};

/**
 *  1 判断是否组件&插件包
 *  2 判断是组件还是插件
 *  3 组件插件分开写入 comp-entry.ts
 * @param {*} ast
 * @param {String} indexPath
 * @return {Object} { type: '', imports: [] } 返回传入组件的类型。如果是组件包，imports 中包含所有子组件的入口文件路径
 */
const typeAssertion = function ({ ast, indexPath }) {
  const result = {
    type: '',
    imports: [],
  };
  const { importDeclarations, variableDeclarations, exportDefaultName, exportDefaultNode } =
    getAssertionTokenByTraverse(ast);

  if (exportDefaultName) {
    importDeclarations.every((node) => {
      const [specifier] = node.specifiers;

      // 从 import 语句中找到 export default 的变量，认为是组件
      if (n.ImportDefaultSpecifier.check(specifier) && specifier.local.name === exportDefaultName) {
        result.type = typeComponent;
        return false;
      }

      return true;
    });

    if (result.type) return result;

    variableDeclarations.every((node) => {
      const [variable] = node.declarations;

      // 从声明变量语句中找到 export default 的变量，认为是组件包
      if (
        n.Identifier.check(variable.id) &&
        variable.id.name === exportDefaultName &&
        n.ObjectExpression.check(variable.init)
      ) {
        if (isPlugin(variable.init.properties)) {
          result.type = typePlugin;
          return false;
        }

        // 从组件包声明中找到对应子组件入口文件
        getComponentPackageImports({ result, properties: variable.init.properties, indexPath, importDeclarations });
      }

      return true;
    });
  }

  if (exportDefaultNode) {
    if (isPlugin(exportDefaultNode.properties)) {
      result.type = typePlugin;
    } else {
      getComponentPackageImports({ result, properties: variable.init.properties, indexPath, importDeclarations });
    }
  }

  return result;
};

const getAssertionTokenByTraverse = (ast) => {
  const importDeclarations = [];
  const variableDeclarations = [];
  let exportDefaultName = '';
  let exportDefaultNode = undefined;

  types.visit(ast, {
    visitImportDeclaration(p) {
      importDeclarations.push(p.node);
      this.traverse(p);
    },
    visitVariableDeclaration(p) {
      variableDeclarations.push(p.node);
      this.traverse(p);
    },
    visitExportDefaultDeclaration(p) {
      const { node } = p;
      const { declaration } = node;

      // 导出的是变量名
      if (n.Identifier.check(declaration)) {
        exportDefaultName = declaration.name;
      }

      // 导出的是对象的字面量
      if (n.ObjectExpression.check(declaration)) {
        exportDefaultNode = declaration;
      }

      this.traverse(p);
    },
  });

  return {
    importDeclarations,
    variableDeclarations,
    exportDefaultName,
    exportDefaultNode,
  };
};

const start = function ({ type, componentFileAffix, units, workingDir }) {
  cwd = workingDir;
  const entries = [];

  Object.keys(units).forEach((componentType) => {
    const package = units[componentType];

    installPackage(package);

    const indexPath = require.resolve(package);
    const indexCode = fs.readFileSync(indexPath, { encoding: 'utf-8', flag: 'r' });
    const ast = parse(indexCode, { parser: require('recast/parsers/typescript') });
    const result = typeAssertion({ ast, indexPath });

    if (result.type === typeComponent) {
      // 组件
      const entry = parseEntry({ ast, package, indexPath });
      entries.push({ type: componentType, entry });
    } else if (result.type === typePlugin) {
      // 插件
      pluginList[componentType] = package;
    } else if (result.type === typeComponentPackage) {
      // 组件&插件包
      result.imports.forEach((i) => {
        const affixReg = new RegExp(`${componentFileAffix}$`);
        if (affixReg.test(i.indexPath)) {
          entries.push({ type: i.type, entry: { component: i.indexPath } });
          return;
        }
        const indexCode = fs.readFileSync(i.indexPath, { encoding: 'utf-8', flag: 'r' });
        const ast = parse(indexCode);
        if (typeAssertion({ ast, indexPath }).type === typePlugin) {
          // 插件
          pluginList[i.type] = i.indexPath;
        } else {
          // 组件
          const entry = parseEntry({ ast, package: `${package} | ${i.name}`, indexPath: i.indexPath });
          entries.push({ type: i.type, entry });
        }
      });
    }
  });

  generateEntry({ entries, type, componentFileAffix });
};

module.exports = start;
