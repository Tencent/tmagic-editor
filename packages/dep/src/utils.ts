import {
  type CodeBlockContent,
  type DataSourceSchema,
  type DepData,
  type HookData,
  HookType,
  type Id,
} from '@tmagic/schema';
import { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX } from '@tmagic/utils';

import Target from './Target';
import { DepTargetType } from './types';

export const createCodeBlockTarget = (id: Id, codeBlock: CodeBlockContent, initialDeps: DepData = {}) =>
  new Target({
    type: DepTargetType.CODE_BLOCK,
    id,
    initialDeps,
    name: codeBlock.name,
    isTarget: (key: string | number, value: any) => {
      if (id === value) {
        return true;
      }

      if (value?.hookType === HookType.CODE && Array.isArray(value.hookData)) {
        const index = value.hookData.findIndex((item: HookData) => item.codeId === id);
        return Boolean(index > -1);
      }

      return false;
    },
  });

export const createDataSourceTarget = (ds: DataSourceSchema, initialDeps: DepData = {}) =>
  new Target({
    type: DepTargetType.DATA_SOURCE,
    id: ds.id,
    initialDeps,
    isTarget: (key: string | number, value: any) => {
      // 关联数据源对象,如：{ isBindDataSource: true, dataSourceId: 'xxx'}
      // 或者在模板在使用数据源,如：`xxx${id.field}xxx`
      if (
        (value?.isBindDataSource && value.dataSourceId && value.dataSourceId === ds.id) ||
        (typeof value === 'string' && value.includes(`${ds.id}`) && /\$\{([\s\S]+?)\}/.test(value))
      ) {
        console.log('value', value, ds.id);
        return true;
      }

      // 指定数据源的字符串模板,如：{ isBindDataSourceField: true, dataSourceId: 'id', template: `xxx${field}xxx`}
      if (
        value?.isBindDataSourceField &&
        value.dataSourceId &&
        value.dataSourceId === ds.id &&
        typeof value.template === 'string'
      ) {
        return true;
      }

      // 关联数据源字段，格式为 [前缀+数据源ID, 字段名]
      if (!Array.isArray(value) || typeof value[0] !== 'string') {
        return false;
      }

      const [prefixId] = value;
      const prefixIndex = prefixId.indexOf(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX);

      if (prefixIndex === -1) {
        return false;
      }

      const dsId = prefixId.substring(prefixIndex + DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX.length);

      return dsId === ds.id;
    },
  });

export const createDataSourceCondTarget = (ds: DataSourceSchema, initialDeps: DepData = {}) =>
  new Target({
    type: DepTargetType.DATA_SOURCE_COND,
    id: ds.id,
    initialDeps,
    isTarget: (key: string | number, value: any) => {
      if (!Array.isArray(value) || value[0] !== ds.id || !`${key}`.startsWith('displayConds')) return false;
      return Boolean(ds?.fields?.find((field) => field.name === value[1]));
    },
  });

export const createDataSourceMethodTarget = (ds: DataSourceSchema, initialDeps: DepData = {}) =>
  new Target({
    type: DepTargetType.DATA_SOURCE_METHOD,
    id: ds.id,
    initialDeps,
    isTarget: (key: string | number, value: any) => {
      if (!Array.isArray(value) || value[0] !== ds.id) return false;

      return Boolean(ds?.methods?.find((method) => method.name === value[1]));
    },
  });
