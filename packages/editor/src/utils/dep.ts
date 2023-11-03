import { isEmpty } from 'lodash-es';

import { type CodeBlockContent, HookType, type Id } from '@tmagic/schema';
import { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX } from '@tmagic/utils';

import dataSourceService from '@editor/services/dataSource';
import { Target } from '@editor/services/dep';
import { DepTargetType, type HookData } from '@editor/type';

export const createCodeBlockTarget = (id: Id, codeBlock: CodeBlockContent) =>
  new Target({
    type: DepTargetType.CODE_BLOCK,
    id,
    name: codeBlock.name,
    isTarget: (key: string | number, value: any) => {
      if (id === value) {
        return true;
      }

      if (value?.hookType === HookType.CODE && !isEmpty(value.hookData)) {
        const index = value.hookData.findIndex((item: HookData) => item.codeId === id);
        return Boolean(index > -1);
      }

      return false;
    },
  });

export const createDataSourceTarget = (id: Id) =>
  new Target({
    type: DepTargetType.DATA_SOURCE,
    id,
    isTarget: (key: string | number, value: any) => {
      // 关联数据源对象或者在模板在使用数据源
      if ((value?.isBindDataSource && value.dataSourceId) || (typeof value === 'string' && value.includes(`${id}`))) {
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

      return dsId === id && Boolean(dataSourceService.getDataSourceById(id));
    },
  });

export const createDataSourceCondTarget = (id: string) =>
  new Target({
    type: DepTargetType.DATA_SOURCE_COND,
    id,
    isTarget: (key: string | number, value: any) => {
      if (!Array.isArray(value) || value[0] !== id || !`${key}`.startsWith('displayConds')) return false;

      const ds = dataSourceService.getDataSourceById(id);

      return Boolean(ds?.fields?.find((field) => field.name === value[1]));
    },
  });

export const createDataSourceMethodTarget = (id: string) =>
  new Target({
    type: DepTargetType.DATA_SOURCE_METHOD,
    id,
    isTarget: (key: string | number, value: any) => {
      if (!Array.isArray(value) || value[0] !== id) return false;

      const ds = dataSourceService.getDataSourceById(id);

      return Boolean(ds?.methods?.find((method) => method.name === value[1]));
    },
  });
