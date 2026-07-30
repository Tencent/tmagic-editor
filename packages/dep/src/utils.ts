import {
  type DataSchema,
  type DataSourceSchema,
  type DepData,
  type HookData,
  HookType,
  type Id,
  NODE_CONDS_KEY,
} from '@tmagic/schema';
import {
  DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX,
  dataSourceTemplateRegExp,
  getKeysArray,
  isObject,
} from '@tmagic/utils';

import Target from './Target';
import { type CodeBlockName, DepTargetType, type TargetDescriptor, type TargetList } from './types';

const INTEGER_REGEXP = /^\d+$/;

export const createCodeBlockTarget = (id: Id, codeBlock: CodeBlockName, initialDeps: DepData = {}) =>
  new Target({
    type: DepTargetType.CODE_BLOCK,
    id,
    initialDeps,
    name: codeBlock.name,
    descriptor: { type: DepTargetType.CODE_BLOCK, id, codeBlock: { name: codeBlock.name } },
    isTarget: (_key: string | number, value: any) => {
      if (id === value) {
        return true;
      }

      if (value?.hookType === HookType.CODE && Array.isArray(value.hookData)) {
        return value.hookData.some((item: HookData) => item.codeId === id);
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
  let f = fields;

  return keys.some((key, index) => {
    const field = f.find(({ name }) => name === key);

    f = field?.fields || [];

    // 字段类型为数组并且后面没有数字索引
    return field?.type === 'array' && index < keys.length - 1 && !INTEGER_REGEXP.test(keys[index + 1]);
  });
};

/**
 * 判断模板(value)是不是使用数据源Id(dsId)，如：`xxx${dsId.field}xxx${dsId.field}`
 * @param value any
 * @param dsId string | number
 * @param hasArray boolean true: 一定要包含有需要迭代的模板; false: 一定要包含普通模板;
 * @returns boolean
 */
export const isDataSourceTemplate = (value: any, ds: Pick<DataSourceSchema, 'id' | 'fields'>, hasArray = false) => {
  // 模板中可能会存在多个表达式，将表达式从模板中提取出来
  const templates: string[] = value.match(dataSourceTemplateRegExp) || [];

  if (templates.length <= 0) {
    return false;
  }

  for (const tpl of templates) {
    // 将${dsId.xxxx} 转成 dsId.xxxx
    const expression = tpl.substring(2, tpl.length - 1);
    const keys = getKeysArray(expression);
    const dsId = keys.shift();

    if (!dsId || dsId !== ds.id) {
      continue;
    }

    // ${dsId.array} ${dsId.array[0]} ${dsId.array[0].a} 这种是依赖
    // ${dsId.array.a} 这种不是依赖，这种需要再迭代器容器中的组件才能使用，依赖由迭代器处理
    const includesArray = isIncludeArrayField(keys, ds.fields);
    if (hasArray === includesArray) {
      return true;
    }
  }

  return false;
};

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
 * @param value any[]
 * @param id string | number
 * @returns boolean
 */
export const isUseDataSourceField = (value: any[], id: string | number) => {
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
 * @param ds Pick<DataSourceSchema, 'id' | 'fields'>
 * @returns boolean
 */
export const isDataSourceTemplateNotIncludeArrayField = (
  value: string,
  ds: Pick<DataSourceSchema, 'id' | 'fields'>,
): boolean => {
  // 模板中可能会存在多个表达式，将表达式从模板中提取出来
  const templates = value.match(dataSourceTemplateRegExp) || [];

  let result = false;
  for (const tpl of templates) {
    // 将${dsId.xxxx} 转成 dsId.xxxx
    const expression = tpl.substring(2, tpl.length - 1);
    const keys = getKeysArray(expression);
    const dsId = keys.shift();

    if (!dsId || dsId !== ds.id) {
      continue;
    }

    // ${dsId.array} ${dsId.array[0]} ${dsId.array[0].a} 这种是依赖
    // ${dsId.array.a} 这种不是依赖，这种需要再迭代器容器中的组件才能使用，依赖由迭代器处理
    if (isIncludeArrayField(keys, ds.fields)) {
      return false;
    }
    result = true;
  }

  return result;
};

export const isDataSourceTarget = (
  ds: Pick<DataSourceSchema, 'id' | 'fields'>,
  key: string | number,
  value: any,
  hasArray = false,
) => {
  if (!value) {
    return false;
  }

  const valueType = typeof value;
  if (valueType !== 'string' && valueType !== 'object') {
    return false;
  }

  if (`${key}`.startsWith(NODE_CONDS_KEY)) {
    return false;
  }

  // 或者在模板在使用数据源
  if (valueType === 'string') {
    return isDataSourceTemplate(value, ds, hasArray);
  }

  // 关联数据源对象,如：{ isBindDataSource: true, dataSourceId: 'xxx'}
  // 使用data-source-select value: 'value' 可以配置出来
  if (isObject(value) && value.isBindDataSource && value.dataSourceId === ds.id) {
    return true;
  }

  if (isSpecificDataSourceTemplate(value, ds.id)) {
    return true;
  }

  if (isUseDataSourceField(value, ds.id)) {
    const [, ...keys] = value;
    const includeArray = isIncludeArrayField(keys, ds.fields);
    return hasArray ? includeArray : !includeArray;
  }

  return false;
};

export const isDataSourceCondTarget = (
  ds: Pick<DataSourceSchema, 'id' | 'fields'>,
  key: string | number,
  value: any,
  hasArray = false,
) => {
  if (!Array.isArray(value) || !ds) {
    return false;
  }

  const [dsId, ...keys] = value;
  // 使用data-source-field-select value: 'key' 可以配置出来
  if (dsId !== ds.id || !`${key}`.startsWith(NODE_CONDS_KEY)) {
    return false;
  }

  if (ds.fields?.some((field) => field.name === keys[0])) {
    const includeArray = isIncludeArrayField(keys, ds.fields);
    return hasArray ? includeArray : !includeArray;
  }

  return false;
};

export const createDataSourceTarget = (ds: Pick<DataSourceSchema, 'id' | 'fields'>, initialDeps: DepData = {}) =>
  new Target({
    type: DepTargetType.DATA_SOURCE,
    id: ds.id,
    initialDeps,
    // isTarget 需要完整 fields 结构（含 type / 嵌套 fields），但不必带上 methods 等无关字段
    descriptor: { type: DepTargetType.DATA_SOURCE, ds: { id: ds.id, fields: ds.fields || [] } },
    isTarget: (key: string | number, value: any) => isDataSourceTarget(ds, key, value),
  });

export const createDataSourceCondTarget = (ds: Pick<DataSourceSchema, 'id' | 'fields'>, initialDeps: DepData = {}) =>
  new Target({
    type: DepTargetType.DATA_SOURCE_COND,
    id: ds.id,
    initialDeps,
    // 与 DATA_SOURCE 相同，只序列化 isTarget 所需的 id + fields
    descriptor: { type: DepTargetType.DATA_SOURCE_COND, ds: { id: ds.id, fields: ds.fields || [] } },
    isTarget: (key: string | number, value: any) => isDataSourceCondTarget(ds, key, value),
  });

export const createDataSourceMethodTarget = (
  ds: Pick<DataSourceSchema, 'id' | 'methods' | 'fields'>,
  initialDeps: DepData = {},
) =>
  new Target({
    type: DepTargetType.DATA_SOURCE_METHOD,
    id: ds.id,
    initialDeps,
    // isTarget 只用方法名/字段名，不序列化 content 等函数，降低 idle 收集通信成本
    descriptor: {
      type: DepTargetType.DATA_SOURCE_METHOD,
      ds: {
        id: ds.id,
        methods: (ds.methods || []).map((method) => ({ name: method.name })),
        fields: (ds.fields || []).map((field) => ({ name: field.name })),
      },
    },
    isTarget: (_key: string | number, value: any) => {
      // 使用data-source-method-select 可以配置出来
      if (!Array.isArray(value)) {
        return false;
      }

      const [dsId, methodName] = value;

      if (!methodName || dsId !== ds.id) {
        return false;
      }

      if (ds.methods?.some((method) => method.name === methodName)) {
        return true;
      }

      // 配置的方法名称可能会是数据源类中定义的，并不存在于methods中，所以这里判断如果methodName如果是字段名称，就表示配置的不是方法
      if (ds.fields?.some((field) => field.name === methodName)) {
        return false;
      }

      return true;
    },
  });

/**
 * 用可序列化描述重建 target，使依赖收集可以在 worker 等无法传递函数的环境中进行
 * @param descriptor 由工厂函数写入 target 的描述
 * @param initialDeps 初始依赖
 * @returns Target
 */
export const createTargetByDescriptor = (descriptor: TargetDescriptor, initialDeps: DepData = {}): Target => {
  switch (descriptor.type) {
    case DepTargetType.CODE_BLOCK:
      return createCodeBlockTarget(descriptor.id, descriptor.codeBlock, initialDeps);
    case DepTargetType.DATA_SOURCE:
      return createDataSourceTarget(descriptor.ds, initialDeps);
    case DepTargetType.DATA_SOURCE_COND:
      return createDataSourceCondTarget(descriptor.ds, initialDeps);
    case DepTargetType.DATA_SOURCE_METHOD:
      // descriptor 只保留名称，对 isTarget 已足够；重建时按同样结构传入
      return createDataSourceMethodTarget(
        descriptor.ds as Pick<DataSourceSchema, 'id' | 'methods' | 'fields'>,
        initialDeps,
      );
    default:
      throw new Error(`unknown target descriptor: ${JSON.stringify(descriptor)}`);
  }
};

export const traverseTarget = (
  targetsList: TargetList,
  cb: (target: Target) => void,
  type?: DepTargetType | string,
) => {
  if (type) {
    const targets = targetsList[type];
    if (targets) {
      for (const target of Object.values(targets)) {
        cb(target);
      }
    }
    return;
  }

  for (const targets of Object.values(targetsList)) {
    for (const target of Object.values(targets)) {
      cb(target);
    }
  }
};
