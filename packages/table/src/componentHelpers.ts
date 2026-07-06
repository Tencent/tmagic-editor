import type { ColumnConfig } from './schema';

export const resolveComponentProps = (config: ColumnConfig, row: any, index: number) => {
  if (typeof config.props === 'function') {
    return config.props(row, index) || {};
  }
  return config.props || {};
};

export const resolveComponentListeners = (config: ColumnConfig, row: any, index: number) => {
  if (typeof config.listeners === 'function') {
    return config.listeners(row, index) || {};
  }
  return config.listeners || {};
};
