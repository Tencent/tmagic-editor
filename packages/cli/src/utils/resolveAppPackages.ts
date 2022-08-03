import { execSync } from 'child_process';
import path from 'path';
import { exit } from 'process';

import fs from 'fs-extra';
import * as recast from 'recast';

import type App from '../Core';
import { Entry, EntryType, PackageType } from '../types';

interface TypeAssertion {
  type: string;
  imports: any[];
}

interface ParseEntryOption {
  ast: any;
  package: string;
  indexPath: string;
}

export const resolveAppPackages = (app: App) => {
  const componentMap: Record<string, string> = {};
  const configMap: Record<string, string> = {};
  const eventMap: Record<string, string> = {};
  const valueMap: Record<string, string> = {};
  const pluginMap: Record<string, string> = {};

  Object.entries(app.options.packages).forEach(([key, packagePath]) => {
    installPackage(packagePath, app.options.source);

    const indexPath = require.resolve(packagePath);
    const indexCode = fs.readFileSync(indexPath, { encoding: 'utf-8', flag: 'r' });
    const ast = recast.parse(indexCode, { parser: require('recast/parsers/typescript') });
    const result = typeAssertion({ ast, indexPath });

    const setItem = (key: string, entry: Entry) => {
      if (entry.component) componentMap[key] = entry.component;
      if (entry.config) configMap[key] = entry.config;
      if (entry.event) eventMap[key] = entry.event;
      if (entry.value) valueMap[key] = entry.value;
    };

    if (result.type === PackageType.COMPONENT) {
      // 组件
      setItem(key, parseEntry({ ast, package: packagePath, indexPath }));
    } else if (result.type === PackageType.PLUGIN) {
      // 插件
      pluginMap[key] = packagePath;
    } else if (result.type === PackageType.COMPONENT_PACKAGE) {
      // 组件&插件包
      result.imports.forEach((i) => {
        const affixReg = new RegExp(`${app.options.componentFileAffix}$`);
        if (affixReg.test(i.indexPath)) {
          componentMap[i.type] = i.indexPath;
          return;
        }
        const indexCode = fs.readFileSync(i.indexPath, { encoding: 'utf-8', flag: 'r' });
        const ast = recast.parse(indexCode);
        if (typeAssertion({ ast, indexPath }).type === PackageType.PLUGIN) {
          // 插件
          pluginMap[i.type] = i.indexPath;
        } else {
          // 组件
          setItem(i.type, parseEntry({ ast, package: `${module} | ${i.name}`, indexPath: i.indexPath }));
        }
      });
    }
  });

  return {
    componentMap,
    configMap,
    eventMap,
    valueMap,
    pluginMap,
  };
};

const installPackage = function (module: string, cwd: string) {
  try {
    // window下需要将路径中\转换成/
    execSync(`node -e "require.resolve('${module.replace(/\\/g, '/')}')"`, { stdio: 'ignore' });
  } catch (e) {
    execSync(`npm install ${module}`, {
      stdio: 'inherit',
      cwd,
    });
  }
};

/**
 *  1 判断是否组件&插件包
 *  2 判断是组件还是插件
 *  3 组件插件分开写入 comp-entry.ts
 * @param {*} ast
 * @param {String} indexPath
 * @return {Object} { type: '', imports: [] } 返回传入组件的类型。如果是组件包，imports 中包含所有子组件的入口文件路径
 */
const typeAssertion = function ({ ast, indexPath }: { ast: any; indexPath: string }): TypeAssertion {
  const n = recast.types.namedTypes;

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
      if (n.ImportDefaultSpecifier.check(specifier) && specifier.local?.name === exportDefaultName) {
        result.type = PackageType.COMPONENT;
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
          result.type = PackageType.PLUGIN;
          return false;
        }

        // 从组件包声明中找到对应子组件入口文件
        getComponentPackageImports({ result, properties: variable.init.properties, indexPath, importDeclarations });
      }

      return true;
    });
  }

  if (exportDefaultNode) {
    if (isPlugin((exportDefaultNode as any).properties)) {
      result.type = PackageType.PLUGIN;
    } else {
      getComponentPackageImports({
        result,
        properties: (exportDefaultNode as any).properties,
        indexPath,
        importDeclarations,
      });
    }
  }

  return result;
};

const getAssertionTokenByTraverse = (ast: any) => {
  const importDeclarations: any[] = [];
  const variableDeclarations: any[] = [];
  const n = recast.types.namedTypes;

  let exportDefaultName = '';
  let exportDefaultNode = undefined;

  recast.types.visit(ast, {
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

const isPlugin = function (properties: any[]) {
  const [match] = properties.filter((property) => property.key.name === 'install');

  return !!match;
};

const getComponentPackageImports = function ({
  result,
  properties,
  indexPath,
  importDeclarations,
}: {
  result: TypeAssertion;
  properties: any[];
  indexPath: string;
  importDeclarations: any[];
}) {
  const n = recast.types.namedTypes;

  result.type = PackageType.COMPONENT_PACKAGE;
  result.imports = [];

  properties.forEach((property) => {
    const [propertyMatch] = importDeclarations.filter((i) => {
      const [specifier] = i.specifiers;

      if (n.ImportDefaultSpecifier.check(specifier) && specifier.local?.name === property.value.name) {
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

const getIndexPath = function (entry: string) {
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

const parseEntry = function ({ ast, package: module, indexPath }: ParseEntryOption) {
  if (!ast.program) {
    console.log(`${module} 入口文件不合法`);
    return exit(1);
  }

  const tokens = getASTTokenByTraverse({ ast, indexPath });
  let { config, value, event } = tokens;
  const { importComponentSource, importComponentToken, exportDefaultToken } = tokens;

  if (!config) {
    console.log(`${module} ${EntryType.CONFIG} 文件声明不合法`);
    return exit(1);
  }
  if (!value) {
    console.log(`${module} ${EntryType.VALUE} 文件声明不合法`);
    return exit(1);
  }
  if (!event) {
    // event 非必须，不需要 exit
    console.log(`${module} ${EntryType.EVENT} 文件声明缺失`);
  }

  const findIndex = importComponentToken.indexOf(exportDefaultToken);
  let component = '';
  if (findIndex > -1) {
    component = path.resolve(path.dirname(indexPath), importComponentSource[findIndex]);
  }

  if (!component) {
    console.log(`${module} ${EntryType.COMPONENT} 文件声明不合法`);
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

const getASTTokenByTraverse = ({ ast, indexPath }: { ast: any; indexPath: string }) => {
  let config = '';
  let value = '';
  let event = '';
  const importComponentToken: string[] = [];
  const importComponentSource: any[] = [];
  let exportDefaultToken = '';

  recast.types.visit(ast, {
    visitImportDeclaration(p) {
      const { node } = p;
      const { specifiers, source } = node;

      importComponentToken.push(specifiers?.[0].local?.name || '');
      importComponentSource.push(source.value);

      this.traverse(p);
    },
    visitExportNamedDeclaration(p) {
      const { node } = p;
      const { specifiers, source } = node;
      const name = specifiers?.[0].exported.name.toLowerCase();

      if (name === EntryType.VALUE) {
        value = path.resolve(path.dirname(indexPath), `${source?.value}`);
      } else if (name === EntryType.CONFIG) {
        config = path.resolve(path.dirname(indexPath), `${source?.value}`);
      } else if (name === EntryType.EVENT) {
        event = path.resolve(path.dirname(indexPath), `${source?.value}`);
      }

      this.traverse(p);
    },
    visitExportDefaultDeclaration(p) {
      const { node } = p;
      const { declaration } = node as any;
      exportDefaultToken = `${declaration.name}`;
      this.traverse(p);
    },
  });

  return {
    config,
    value,
    event,
    importComponentToken,
    importComponentSource,
    exportDefaultToken,
  };
};
