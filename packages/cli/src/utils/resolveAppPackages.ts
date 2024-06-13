import { execSync } from 'child_process';
import path from 'path';
import { exit } from 'process';

import fs from 'fs-extra';
import * as recast from 'recast';

import type App from '../Core';
import { EntryType, ModuleMainFilePath, NpmConfig, PackageType } from '../types';

import { error, execInfo, info } from './logger';

type Ast = any;

interface TypeAssertion {
  type: string;
  imports: any[];
}

interface ParseEntryOption {
  ast: Ast;
  package: string;
  indexPath: string;
}

interface TypeAssertionOption {
  ast: Ast;
  indexPath: string;
  componentFileAffix?: string;
  datasoucreSuperClass?: string[];
}

const isFile = (filePath: string) => fs.existsSync(filePath) && fs.lstatSync(filePath).isFile();
const isDirectory = (filePath: string) => fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory();

const getRelativePath = (str: string, base: string) => (path.isAbsolute(str) ? path.relative(base, str) : str);

const npmInstall = function (dependencies: Record<string, string>, cwd: string, npmConfig: NpmConfig = {}) {
  try {
    const { client = 'npm', registry } = npmConfig;
    const install = {
      npm: 'install',
      yarn: 'add',
      pnpm: 'add',
    }[client];

    const packages = Object.entries(dependencies)
      .map(([name, version]) => (version ? `${name}@${version}` : name))
      .join(' ');

    const command = `${client} ${install} ${packages}${registry ? ` --registry ${registry}` : ''}`;

    execInfo(cwd);
    execInfo(command);

    execSync(command, {
      stdio: 'inherit',
      cwd,
    });
  } catch (e) {
    error(e as string);
  }
};

/**
 *  1 判断是否组件&插件&数据源包
 *  2 判断是组件还是插件还是数据源
 *  3 组件插件数据源分开写入 comp-entry.ts
 *
 *  export default 是对象字面量并且有install方法则为插件
 *
 *  export default 是类并且superClass为DataSource则为数据源
 *
 *  其他情况为组件或者包
 *
 * @param {*} ast
 * @param {String} indexPath
 * @return {Object} { type: '', imports: [] } 返回传入组件的类型。如果是组件包，imports 中包含所有子组件的入口文件路径
 */
const typeAssertion = function ({
  ast,
  indexPath,
  componentFileAffix,
  datasoucreSuperClass,
}: TypeAssertionOption): TypeAssertion {
  const n = recast.types.namedTypes;

  const result: TypeAssertion = {
    type: '',
    imports: [],
  };

  const { importDeclarations, variableDeclarations, exportDefaultName, exportDefaultNode, exportDefaultClass } =
    getAssertionTokenByTraverse(ast);

  if (exportDefaultName) {
    importDeclarations.every((node) => {
      const [specifier] = node.specifiers;

      const defaultFile = getIndexPath(path.resolve(path.dirname(indexPath), node.source.value));
      if (componentFileAffix && !['.js', '.ts'].includes(componentFileAffix)) {
        if (node.source.value?.endsWith(componentFileAffix) || isFile(`${defaultFile}${componentFileAffix}`)) {
          result.type = PackageType.COMPONENT;
          return false;
        }
      }

      if (isFile(defaultFile)) {
        const defaultCode = fs.readFileSync(defaultFile, { encoding: 'utf-8', flag: 'r' });
        const ast = recast.parse(defaultCode, { parser: require('recast/parsers/typescript') });
        if (
          isDatasource(
            datasoucreSuperClass,
            ast.program.body.find((node: any) => node.type === 'ExportDefaultDeclaration')?.declaration,
          )
        ) {
          result.type = PackageType.DATASOURCE;
          return false;
        }
      }

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

  if (isDatasource(datasoucreSuperClass, exportDefaultClass)) {
    result.type = PackageType.DATASOURCE;
  }

  return result;
};

const getAssertionTokenByTraverse = (ast: any) => {
  const importDeclarations: any[] = [];
  const variableDeclarations: any[] = [];
  const n = recast.types.namedTypes;

  let exportDefaultName = '';
  let exportDefaultNode = undefined;
  let exportDefaultClass = undefined;

  recast.types.visit(ast, {
    visitImportDeclaration(p) {
      importDeclarations.push(p.node);
      this.traverse(p);
    },
    visitVariableDeclaration(p) {
      variableDeclarations.push(p.node);
      this.traverse(p);
    },
    visitExportNamedDeclaration(p) {
      const { node } = p;
      const { specifiers } = node;

      const specifier = specifiers?.find((specifier) => specifier.exported.name === 'default');

      if (specifier?.local) {
        exportDefaultName = `${specifier.local.name}`;
      }

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

      // 导出的是类
      if (n.ClassDeclaration.check(declaration)) {
        exportDefaultClass = declaration;
      }

      this.traverse(p);
    },
  });

  return {
    importDeclarations,
    variableDeclarations,
    exportDefaultName,
    exportDefaultNode,
    exportDefaultClass,
  };
};

const isPlugin = function (properties: any[]) {
  const [match] = properties.filter((property) => property.key.name === 'install');

  return !!match;
};

const isDatasource = (datasoucreSuperClass: string[] = [], exportDefaultClass: any) =>
  [...datasoucreSuperClass, 'DataSource', 'HttpDataSource'].includes(exportDefaultClass?.superClass?.name);

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
        type: property.key.name ?? property.key.value,
        name: propertyMatch.specifiers[0].local.name,
        indexPath: getIndexPath(path.resolve(path.dirname(indexPath), propertyMatch.source.value)),
      });
    }
  });

  return result;
};

const getIndexPath = function (entry: string) {
  for (const affix of ['', '.js', '.ts']) {
    const filePath = `${entry}${affix}`;
    if (isFile(filePath)) {
      return filePath;
    }
  }

  if (isDirectory(entry)) {
    const files = fs.readdirSync(entry);
    const [index] = files.filter((file) => file.split('.')[0] === 'index');

    return path.resolve(entry, index);
  }

  return entry;
};

const parseEntry = function ({ ast, package: module, indexPath }: ParseEntryOption) {
  if (!ast.program) {
    error(`${module} 入口文件不合法`);
    exit(1);
  }

  const tokens = getASTTokenByTraverse({ ast, indexPath });
  let { config, value, event, component } = tokens;

  if (!config) {
    info(`${module} 表单配置文件声明缺失`);
  }
  if (!value) {
    info(`${module} 初始化数据文件声明缺失`);
  }
  if (!event) {
    info(`${module} 事件声明文件声明缺失`);
  }
  if (!component) {
    info(`${module} 组件或数据源文件声明不合法`);
    exit(1);
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
  let component = '';
  const importSpecifiersMap: { [key: string]: string } = {};
  const exportSpecifiersMap: { [key: string]: string | undefined } = {};

  recast.types.visit(ast, {
    visitImportDeclaration(p) {
      const { node } = p;
      const { specifiers, source } = node;

      if (specifiers?.length === 1 && source.value) {
        const name = specifiers?.[0].local?.name;
        if (typeof name === 'string') {
          importSpecifiersMap[name] = source.value as string;
        }
      }

      this.traverse(p);
    },
    visitExportNamedDeclaration(p) {
      const { node } = p;
      const { specifiers, source, declaration } = node;

      if (specifiers?.length === 1 && source?.value) {
        const name = specifiers?.[0]?.exported.name;
        if (typeof name === 'string') {
          exportSpecifiersMap[name.toLowerCase()] = source.value as string;
        }
      } else {
        specifiers?.forEach((specifier) => {
          const { name } = specifier.exported;
          if (typeof name === 'string') {
            exportSpecifiersMap[name.toLowerCase()] = undefined;
          }
        });
        (declaration as any)?.declarations.forEach((declare: any) => {
          const { id, init } = declare;
          const { name } = id;
          exportSpecifiersMap[name] = init.name;
        });
      }

      this.traverse(p);
    },
    visitExportDefaultDeclaration(p) {
      const { node } = p;
      const { declaration } = node as any;
      component = path.resolve(path.dirname(indexPath), importSpecifiersMap[declaration.name]);
      this.traverse(p);
    },
  });

  Object.keys(exportSpecifiersMap).forEach((exportName) => {
    const exportValue = exportSpecifiersMap[exportName];
    const importValue = importSpecifiersMap[exportName];
    const connectValue = exportValue ? importSpecifiersMap[exportValue] : '';
    const filePath = path.resolve(path.dirname(indexPath), connectValue || importValue || exportValue || '');

    if (exportName === EntryType.VALUE) {
      value = filePath;
    } else if (exportName === EntryType.CONFIG) {
      config = filePath;
    } else if (exportName === EntryType.EVENT) {
      event = filePath;
    } else if (exportName === 'default') {
      component = component || filePath;
    }
  });

  return {
    config,
    value,
    event,
    component,
  };
};

const splitNameVersion = function (str: string) {
  if (typeof str !== 'string') {
    return {};
  }

  if (fs.existsSync(str)) {
    return {
      name: str,
      version: '',
    };
  }

  const packStr = String.prototype.trim.call(str);
  const ret = packStr.match(/((^|@).+)@(.+)/);
  let name = packStr;
  let version = 'latest';
  if (ret && ret[3] !== '') {
    ({ 1: name, 3: version } = ret);
  }
  return {
    name,
    version,
  };
};

const getDependencies = (dependencies: Record<string, string>, packagePath: string) => {
  if (fs.existsSync(packagePath)) return;

  const { name: moduleName, version } = splitNameVersion(packagePath);

  if (!moduleName) return;

  dependencies[moduleName] = version;
};

const setPackages = (packages: ModuleMainFilePath, app: App, packagePath: string, key?: string) => {
  const { options } = app;
  const { temp, source, componentFileAffix, datasoucreSuperClass } = options;

  let { name: moduleName } = splitNameVersion(packagePath);

  if (!moduleName) throw Error('packages中包含非法配置');

  if (isDirectory(moduleName)) {
    if (!fs.existsSync(path.join(moduleName, './package.json'))) {
      ['index.js', 'index.ts'].forEach((index) => {
        const indexFile = path.join(moduleName!, `./${index}`);
        if (fs.existsSync(indexFile)) {
          moduleName = indexFile;
          return;
        }
      });
    }
  }

  // 获取完整路径
  const indexPath = execSync(`node -e "console.log(require.resolve('${moduleName.replace(/\\/g, '/')}'))"`, {
    cwd: source,
  })
    .toString()
    .replace('\n', '');

  const indexCode = fs.readFileSync(indexPath, { encoding: 'utf-8', flag: 'r' });
  const ast: Ast = recast.parse(indexCode, { parser: require('recast/parsers/typescript') });
  const result = typeAssertion({ ast, indexPath, componentFileAffix, datasoucreSuperClass });

  // 组件&插件&数据源包
  if (result.type === PackageType.COMPONENT_PACKAGE) {
    result.imports.forEach((i) => {
      setPackages(packages, app, i.indexPath, i.type);
    });

    return;
  }

  if (!key) return;

  if (result.type === PackageType.COMPONENT) {
    // 组件
    const entry = parseEntry({ ast, package: moduleName, indexPath });

    if (entry.component) packages.componentMap[key] = getRelativePath(entry.component, temp);
    if (entry.config) packages.configMap[key] = getRelativePath(entry.config, temp);
    if (entry.event) packages.eventMap[key] = getRelativePath(entry.event, temp);
    if (entry.value) packages.valueMap[key] = getRelativePath(entry.value, temp);
  } else if (result.type === PackageType.DATASOURCE) {
    // 数据源
    const entry = parseEntry({ ast, package: moduleName, indexPath });

    if (entry.component) packages.datasourceMap[key] = getRelativePath(entry.component, temp);
    if (entry.config) packages.dsConfigMap[key] = getRelativePath(entry.config, temp);
    if (entry.event) packages.dsEventMap[key] = getRelativePath(entry.event, temp);
    if (entry.value) packages.dsValueMap[key] = getRelativePath(entry.value, temp);
  } else if (result.type === PackageType.PLUGIN) {
    // 插件
    packages.pluginMap[key] = getRelativePath(moduleName, temp);
  }
};

const flattenPackagesConfig = (packages: (string | Record<string, string>)[]) => {
  const packagesConfig: ([string] | [string, string])[] = [];
  packages.forEach((item) => {
    if (typeof item === 'object') {
      Object.entries(item).forEach(([key, packagePath]) => {
        packagesConfig.push([packagePath, key]);
      });
    } else if (typeof item === 'string') {
      packagesConfig.push([item]);
    }
  });
  return packagesConfig;
};

export const resolveAppPackages = (app: App): ModuleMainFilePath => {
  const dependencies: Record<string, string> = {};

  const { packages = [], npmConfig = {}, source } = app.options;

  const packagePaths = flattenPackagesConfig(packages);

  packagePaths.forEach(([packagePath]) => getDependencies(dependencies, packagePath));

  if (npmConfig.autoInstall && Object.keys(dependencies).length) {
    if (!npmConfig.keepPackageJsonClean) {
      npmInstall(dependencies, source, npmConfig);
    } else {
      const packageFile = path.join(source, 'package.json');
      const packageBakFile = path.join(source, 'package.json.bak');
      if (fs.existsSync(packageFile)) {
        fs.copyFileSync(packageFile, packageBakFile);
      }

      npmInstall(dependencies, source, npmConfig);

      if (fs.existsSync(packageBakFile)) {
        fs.unlinkSync(packageFile);
        fs.renameSync(packageBakFile, packageFile);
      }
    }
  }

  const packagesMap: ModuleMainFilePath = {
    componentMap: {},
    configMap: {},
    eventMap: {},
    valueMap: {},
    pluginMap: {},
    datasourceMap: {},
    dsConfigMap: {},
    dsEventMap: {},
    dsValueMap: {},
  };

  packagePaths.forEach(([packagePath, key]) => setPackages(packagesMap, app, packagePath, key));

  return packagesMap;
};
