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
import { CustomTargetOptions, DepTargetType } from './types';

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

export const createRelatedCompTarget = (options: CustomTargetOptions) =>
  new Target({
    id: DepTargetType.RELATED_COMP_WHEN_COPY,
    type: DepTargetType.RELATED_COMP_WHEN_COPY,
    ...options,
  });

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

      // 或者在模板在使用数据源,如：`xxx${dsId.field}xxx${dsId.field}`
      if (typeof value === 'string' && value.includes(`${ds.id}`) && /\$\{([\s\S]+?)\}/.test(value)) {
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
          let includeArray = false;
          keys.reduce((accumulator: DataSchema[], currentValue: string, currentIndex: number) => {
            const field = accumulator.find(({ name }) => name === currentValue);
            if (
              field &&
              field.type === 'array' &&
              typeof keys[currentIndex + 1] !== 'number' &&
              currentIndex < keys.length - 1
            ) {
              includeArray = true;
            }
            return field?.fields || [];
          }, ds.fields);

          if (includeArray) {
            continue;
          }

          return true;
        }

        return false;
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
      // 使用data-source-field-select value: 'value' 可以配置出来
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

      return Boolean(ds?.methods?.find((method) => method.name === value[1]));
    },
  });
