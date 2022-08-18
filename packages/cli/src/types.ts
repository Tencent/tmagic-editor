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
  registry?: string;
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
  packages: (string | Record<string, string>)[];
  componentFileAffix: string;
  cleanTemp: boolean;
  npmConfig?: NpmConfig;
  onInit?: (app: Core) => ModuleMainFilePath | Promise<ModuleMainFilePath>;
  onPrepare?: (app: Core) => void;
}
