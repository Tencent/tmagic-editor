import { cloneDeep, template } from 'lodash-es';

import { isDataSourceTemplate, isUseDataSourceField, Target, Watcher } from '@tmagic/dep';
import type { MApp, MNode, MPage, MPageFragment } from '@tmagic/schema';
import {
  compiledCond,
  compiledNode,
  DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX,
  DSL_NODE_KEY_COPY_PREFIX,
  getValueByKeyPath,
  isPage,
  isPageFragment,
  replaceChildNode,
} from '@tmagic/utils';

import type { DataSourceManagerData } from './types';

export const compliedConditions = (node: MNode, data: DataSourceManagerData) => {
  if (!node.displayConds || !Array.isArray(node.displayConds) || !node.displayConds.length) return true;

  for (const { cond } of node.displayConds) {
    if (!cond) continue;

    let result = true;
    for (const { op, value, range, field } of cond) {
      const [sourceId, ...fields] = field;

      const dsData = data[sourceId];

      if (!dsData || !fields.length) {
        break;
      }

      const fieldValue = getValueByKeyPath(fields.join('.'), data[sourceId]);

      if (!compiledCond(op, fieldValue, value, range)) {
        result = false;
        break;
      }
    }

    if (result) {
      return true;
    }
  }

  return false;
};

export const updateNode = (node: MNode, dsl: MApp) => {
  if (isPage(node) || isPageFragment(node)) {
    const index = dsl.items?.findIndex((child: MNode) => child.id === node.id);
    dsl.items.splice(index, 1, node as MPage | MPageFragment);
  } else {
    replaceChildNode(node, dsl!.items);
  }
};

export const createIteratorContentData = (itemData: any, dsId: string, fields: string[] = []) => {
  const data = {
    [dsId]: {},
  };

  fields.reduce((obj: any, field, index) => {
    obj[field] = index === fields.length - 1 ? itemData : {};

    return obj[field];
  }, data[dsId]);

  return data;
};

export const compliedDataSourceField = (value: any, data: DataSourceManagerData) => {
  const [prefixId, ...fields] = value;
  const prefixIndex = prefixId.indexOf(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX);

  if (prefixIndex > -1) {
    const dsId = prefixId.substring(prefixIndex + DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX.length);

    const dsData = data[dsId];

    if (!dsData) return value;

    return getValueByKeyPath(fields.join('.'), dsData);
  }

  return value;
};

export const compiledNodeField = (value: any, data: DataSourceManagerData) => {
  // 使用data-source-input等表单控件配置的字符串模板，如：`xxx${id.field}xxx`
  if (typeof value === 'string') {
    return template(value)(data);
  }

  // 使用data-source-select等表单控件配置的数据源，如：{ isBindDataSource: true, dataSourceId: 'xxx'}
  if (value?.isBindDataSource && value.dataSourceId) {
    return data[value.dataSourceId];
  }

  // 指定数据源的字符串模板，如：{ isBindDataSourceField: true, dataSourceId: 'id', template: `xxx${field}xxx`}
  if (value?.isBindDataSourceField && value.dataSourceId && typeof value.template === 'string') {
    return template(value.template)(data[value.dataSourceId]);
  }

  // 使用data-source-field-select等表单控件的数据源字段，如：[`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}${id}`, 'field']
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return compliedDataSourceField(value, data);
  }

  return value;
};

export const compliedIteratorItems = (itemData: any, items: MNode[], dsId: string, keys: string[] = []) => {
  const watcher = new Watcher();
  watcher.addTarget(
    new Target({
      id: dsId,
      isTarget: (key: string | number, value: any) => {
        if (`${key}`.startsWith(DSL_NODE_KEY_COPY_PREFIX)) {
          return false;
        }

        return isDataSourceTemplate(value, dsId) || isUseDataSourceField(value, dsId);
      },
    }),
  );

  watcher.collect(items, true);

  const { deps } = watcher.getTarget(dsId);
  if (!Object.keys(deps).length) {
    return items;
  }

  return items.map((item) => {
    if (!deps[item.id]?.keys.length) {
      return item;
    }

    return compiledNode(
      (value: any) => {
        const ctxData = createIteratorContentData(itemData, dsId, keys);
        return compiledNodeField(value, ctxData);
      },
      cloneDeep(item),
      {
        [dsId]: deps,
      },
      dsId,
    );
  });
};
