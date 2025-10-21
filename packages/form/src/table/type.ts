import type { TableConfig } from '@tmagic/form-schema';

export interface TableProps {
  model: any;
  lastValues?: any;
  isCompare?: boolean;
  config: TableConfig;
  name: string;
  prop?: string;
  labelWidth?: string;
  sort?: boolean;
  disabled?: boolean;
  sortKey?: string;
  text?: string;
  size?: string;
  enableToggleMode?: boolean;
  showIndex?: boolean;
}
