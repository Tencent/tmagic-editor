import type Core from './Core';

export enum EntryType {
  CONFIG = 'config',
  VALUE = 'value',
  COMPONENT = 'component',
  EVENT = 'event',
  PLUGIN = 'plugin',
}

export enum PackageType {
  COMPONENT = '1',
  PLUGIN = '2',
  COMPONENT_PACKAGE = '3',
}

export interface Entry {
  [EntryType.CONFIG]?: string;
  [EntryType.VALUE]?: string;
  [EntryType.COMPONENT]?: string;
  [EntryType.EVENT]?: string;
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
}

export interface ModuleMainFilePath {
  componentMap: Record<string, string>;
  pluginMap: Record<string, string>;
  configMap: Record<string, string>;
  valueMap: Record<string, string>;
  eventMap: Record<string, string>;
}

export interface UserConfig {
  source: string;
  temp: string;
  /** 组件目录或者npm包名 */
  packages: (string | Record<string, string>)[];
  /** 组件文件后缀名，例如vue文件为.vue，tsx文件为.tsx，普通js文件则为.js */
  componentFileAffix: string;
  cleanTemp: boolean;
  /** npm 配置，用于当packages配置有npm包名时，可以自动安装npm包 */
  npmConfig?: NpmConfig;
  onInit?: (app: Core) => ModuleMainFilePath | Promise<ModuleMainFilePath>;
  onPrepare?: (app: Core) => void;
}

export type UserConfigLoader = (userConfigPath: string) => Promise<UserConfig>;
