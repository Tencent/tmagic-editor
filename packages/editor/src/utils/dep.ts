import { isEmpty } from 'lodash-es';

import { CodeBlockContent, HookType, Id } from '@tmagic/schema';

import dataSourceService from '@editor/services/dataSource';
import { Target } from '@editor/services/dep';
import { DepTargetType, HookData } from '@editor/type';

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
    isTarget: (key: string | number, value: any) =>
      // 关联数据源对象或者在模板在使用数据源
      (value?.isBindDataSource && value.dataSourceId) || (typeof value === 'string' && value.includes(`${id}`)),
  });

export const createDataSourceCondTarget = (id: string) =>
  new Target({
    type: DepTargetType.DATA_SOURCE_COND,
    id,
    isTarget: (key: string | number, value: any) => {
      if (!Array.isArray(value) || value[0] !== id) return false;

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
