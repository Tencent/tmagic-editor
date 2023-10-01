import type Core from './Core';

export type App = Core;

export enum EntryType {
  CONFIG = 'config',
  VALUE = 'value',
  EVENT = 'event',
  COMPONENT = 'component',
  PLUGIN = 'plugin',
  DS_CONFIG = 'dsConfig',
  DS_VALUE = 'dsValue',
  DS_EVENT = 'dsEvent',
  DATASOURCE = 'datasource',
}

export enum PackageType {
  COMPONENT = '1',
  PLUGIN = '2',
  COMPONENT_PACKAGE = '3',
  DATASOURCE = '4',
}

export interface Entry {
  [EntryType.CONFIG]?: string;
  [EntryType.VALUE]?: string;
  [EntryType.COMPONENT]?: string;
  [EntryType.EVENT]?: string;
  [EntryType.DATASOURCE]?: string;
}

export interface OptionEntry {
  type: string;
  entry: Entry;
}

export interface EntryFile {
  entries: OptionEntry[];
  entryFile: string;
  type: EntryType;
  componentFileAffix: string;
}

export interface NpmConfig {
  /** npm镜像代理 */
  registry?: string;
  /** pnpm | npm | yarn */
  client?: 'npm' | 'yarn' | 'pnpm';
  /** 是否自动安装组件依赖，默认为true */
  autoInstall?: boolean;
  /** 安装组件后，npm默认会将依赖写入package.json中，将该值设置为true，则不会写入，默认为true */
  keepPackageJsonClean?: boolean;
}

export interface ModuleMainFilePath {
  componentMap: Record<string, string>;
  pluginMap: Record<string, string>;
  configMap: Record<string, string>;
  valueMap: Record<string, string>;
  eventMap: Record<string, string>;
  datasourceMap: Record<string, string>;
  dsConfigMap: Record<string, string>;
  dsValueMap: Record<string, string>;
  dsEventMap: Record<string, string>;
}

export interface UserConfig {
  source: string;
  temp: string;
  /** 组件目录或者npm包名 */
  packages: (string | Record<string, string>)[];
  /** 组件文件后缀名，例如vue文件为.vue，tsx文件为.tsx，普通js文件则为.js */
  componentFileAffix?: string;
  /** 继承这些类的类将被判定为数据源，默认有['DataSource', 'HttpDataSource'] */
  datasoucreSuperClass?: string[];
  cleanTemp?: boolean;
  /** 入口文件是否生成为 ts 格式 */
  useTs?: boolean;
  /** npm 配置，用于当packages配置有npm包名时，可以自动安装npm包 */
  npmConfig?: NpmConfig;
  /** 是否使用import()加载组件 */
  dynamicImport?: boolean;
  hooks?: {
    beforeWriteEntry?: (genContentMap: Record<string, string>, app: Core) => Promise<Record<string, string>>;
  };
  onInit?: (app: Core) => ModuleMainFilePath | Promise<ModuleMainFilePath>;
  onPrepare?: (app: Core) => void;
}

export type UserConfigLoader = (userConfigPath: string) => Promise<UserConfig>;
