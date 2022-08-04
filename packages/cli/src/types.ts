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

export interface UserConfig {
  source: string;
  temp: string;
  packages: Record<string, any>;
  componentFileAffix: string;
  cleanTemp: boolean;
}
