import {
  type CodeBlockContent,
  type DataSchema,
  type DataSourceSchema,
  type DepData,
  type HookData,
  HookType,
  type Id,
} from '@tmagic/schema';
import { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX } from '@tmagic/utils';

import Target from './Target';
import { DepTargetType, type TargetList } from './types';

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

/**
 * ['array'] ['array', '0'] ['array', '0', 'a'] 这种返回false
 * ['array', 'a'] 这种返回true
 * @param keys
 * @param fields
 * @returns boolean
 */
export const isIncludeArrayField = (keys: string[], fields: DataSchema[]) => {
  let includeArray = false;

  keys.reduce((accumulator: DataSchema[], currentValue: string, currentIndex: number) => {
    const field = accumulator.find(({ name }) => name === currentValue);
    if (
      field &&
      field.type === 'array' &&
      // 不是整数
      /^(?!\d+$).*$/.test(`${keys[currentIndex + 1]}`) &&
      currentIndex < keys.length - 1
    ) {
      includeArray = true;
    }
    return field?.fields || [];
  }, fields);

  return includeArray;
};

/**
 * 判断模板(value)是不是使用数据源Id(dsId)，如：`xxx${dsId.field}xxx${dsId.field}`
 * @param value any
 * @param dsId string | number
 * @returns boolean
 */
export const isDataSourceTemplate = (value: any, dsId: string | number) =>
  typeof value === 'string' && value.includes(`${dsId}`) && /\$\{([\s\S]+?)\}/.test(value);

/**
 * 指定数据源的字符串模板,如：{ isBindDataSourceField: true, dataSourceId: 'id', template: `xxx${field}xxx`}
 * @param value any
 * @param dsId string | number
 * @returns boolean
 */
export const isSpecificDataSourceTemplate = (value: any, dsId: string | number) =>
  value?.isBindDataSourceField &&
  value.dataSourceId &&
  value.dataSourceId === dsId &&
  typeof value.template === 'string';

/**
 * 关联数据源字段，格式为 [前缀+数据源ID, 字段名]
 * 使用data-source-field-select value: 'value' 可以配置出来
 * @param value any
 * @param id string | number
 * @returns boolean
 */
export const isUseDataSourceField = (value: any, id: string | number) => {
  if (!Array.isArray(value) || typeof value[0] !== 'string') {
    return false;
  }

  const [prefixId] = value;
  const prefixIndex = prefixId.indexOf(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX);

  if (prefixIndex === -1) {
    return false;
  }

  const dsId = prefixId.substring(prefixIndex + DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX.length);

  return dsId === id;
};

/**
 * 判断是否不包含${dsId.array.a}
 * @param value any
 * @param ds DataSourceSchema
 * @returns boolean
 */
export const isDataSourceTemplateNotIncludeArrayField = (value: string, ds: DataSourceSchema): boolean => {
  // 模板中可能会存在多个表达式，将表达式从模板中提取出来
  const templates = value.match(/\$\{([\s\S]+?)\}/g) || [];

  for (const tpl of templates) {
    const keys = tpl
      // 将${dsId.xxxx} 转成 dsId.xxxx
      .substring(2, tpl.length - 1)
      // 将 array[0] 转成 array.0
      .replaceAll(/\[(\d+)\]/g, '.$1')
      .split('.');
    const dsId = keys.shift();

    if (!dsId || dsId !== ds.id) {
      continue;
    }

    // ${dsId.array} ${dsId.array[0]} ${dsId.array[0].a} 这种是依赖
    // ${dsId.array.a} 这种不是依赖，这种需要再迭代器容器中的组件才能使用，依赖由迭代器处理
    if (isIncludeArrayField(keys, ds.fields)) {
      return false;
    }
  }

  return true;
};

export const createDataSourceTarget = (ds: DataSourceSchema, initialDeps: DepData = {}) =>
  new Target({
    type: DepTargetType.DATA_SOURCE,
    id: ds.id,
    initialDeps,
    isTarget: (key: string | number, value: any) => {
      // 关联数据源对象,如：{ isBindDataSource: true, dataSourceId: 'xxx'}
      // 使用data-source-select value: 'value' 可以配置出来

      if (value?.isBindDataSource && value.dataSourceId && value.dataSourceId === ds.id) {
        return true;
      }

      // 或者在模板在使用数据源
      if (isDataSourceTemplate(value, ds.id)) {
        return isDataSourceTemplateNotIncludeArrayField(value, ds);
      }

      if (isSpecificDataSourceTemplate(value, ds.id)) {
        return true;
      }

      if (isUseDataSourceField(value, ds.id)) {
        const [, ...keys] = value;
        return !isIncludeArrayField(keys, ds.fields);
      }

      return false;
    },
  });

export const createDataSourceCondTarget = (ds: DataSourceSchema, initialDeps: DepData = {}) =>
  new Target({
    type: DepTargetType.DATA_SOURCE_COND,
    id: ds.id,
    initialDeps,
    isTarget: (key: string | number, value: any) => {
      // 使用data-source-field-select value: 'key' 可以配置出来
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
      // 使用data-source-method-select 可以配置出来
      if (!Array.isArray(value) || value[0] !== ds.id) return false;

      return true;
    },
  });

export const traverseTarget = (
  targetsList: TargetList,
  cb: (target: Target) => void,
  type?: DepTargetType | string,
) => {
  Object.values(targetsList).forEach((targets) => {
    Object.values(targets).forEach((target) => {
      if (type && target.type !== type) {
        return;
      }
      cb(target);
    });
  });
};
