import { cloneDeep, template } from 'lodash-es';

import { isDataSourceTemplate, isUseDataSourceField, Target, Watcher } from '@tmagic/dep';
import type { DepData, DisplayCond, DisplayCondItem, MApp, MNode, MPage, MPageFragment } from '@tmagic/schema';
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

import type { AsyncDataSourceResolveResult, DataSourceManagerData } from './types';

/**
 * 编译显示条件
 * @param cond 条件配置
 * @param data 上下文数据（数据源数据）
 * @returns boolean
 */
export const compiledCondition = (cond: DisplayCondItem[], data: DataSourceManagerData) => {
  let result = true;
  for (const { op, value, range, field } of cond) {
    const [sourceId, ...fields] = field;

    const dsData = data[sourceId];

    if (!dsData || !fields.length) {
      break;
    }

    const fieldValue = getValueByKeyPath(fields.join('.'), dsData);

    if (!compiledCond(op, fieldValue, value, range)) {
      result = false;
      break;
    }
  }

  return result;
};

/**
 * 编译数据源条件组
 * @param node dsl节点
 * @param data 数据源数据
 * @returns boolean
 */
export const compliedConditions = (node: { displayConds?: DisplayCond[] }, data: DataSourceManagerData) => {
  if (!node.displayConds || !Array.isArray(node.displayConds) || !node.displayConds.length) return true;

  for (const { cond } of node.displayConds) {
    if (!cond) continue;

    if (compiledCondition(cond, data)) {
      return true;
    }
  }

  return false;
};

/**
 * 编译迭代器容器子项显示条件
 * @param displayConds 条件组配置
 * @param data 迭代器容器的迭代数据项
 * @returns boolean
 */
export const compliedIteratorItemConditions = (displayConds: DisplayCond[] = [], data: DataSourceManagerData) => {
  if (!displayConds || !Array.isArray(displayConds) || !displayConds.length) return true;

  for (const { cond } of displayConds) {
    if (!cond) continue;

    let result = true;
    for (const { op, value, range, field } of cond) {
      const fieldValue = getValueByKeyPath(field.join('.'), data);

      if (!compiledCond(op, fieldValue, value, range)) {
        result = false;
        break;
      }
    }

    if (result) {
      return result;
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

/**
 * 创建迭代器容器编译的数据上下文
 * @param itemData 迭代数据
 * @param dsId 数据源id
 * @param fields dsl节点字段，如a.b.c
 * @returns 数据上下文
 */
export const createIteratorContentData = (
  itemData: any,
  dsId: string,
  fields: string[] = [],
  dsData: DataSourceManagerData = {},
) => {
  const data = {
    ...dsData,
    [dsId]: {},
  };

  fields.reduce((obj: any, field, index) => {
    obj[field] = index === fields.length - 1 ? itemData : {};

    return obj[field];
  }, data[dsId]);

  return data;
};

/**
 * 编译通过tmagic-editor的数据源源选择器配(data-source-field-select)
 * 格式为 [`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}${id}`, 'field']
 * DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX常量可通过@tmagic/utils获取
 *
 * @param value dsl节点中的数据源配置
 * @param data 数据源数据
 * @returns 编译好的配置
 */
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

/**
 * 编译通过tmagic-editor的数据源源选择器（data-source-input，data-source-select，data-source-field-select）配置出来的数据，或者其他符合规范的配置
 * @param value dsl节点中的数据源配置
 * @param data 数据源数据
 * @returns 编译好的配置
 */
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

export const compliedIteratorItems = (
  itemData: any,
  items: MNode[],
  dsId: string,
  keys: string[] = [],
  data: DataSourceManagerData,
  inEditor = false,
) => {
  const watcher = new Watcher();
  watcher.addTarget(
    new Target({
      id: dsId,
      type: 'data-source',
      isTarget: (key: string | number, value: any) => {
        if (`${key}`.startsWith(DSL_NODE_KEY_COPY_PREFIX)) {
          return false;
        }

        return isDataSourceTemplate(value, dsId) || isUseDataSourceField(value, dsId);
      },
    }),
  );

  watcher.addTarget(
    new Target({
      id: dsId,
      type: 'cond',
      isTarget: (key, value) => {
        // 使用data-source-field-select value: 'key' 可以配置出来
        if (!Array.isArray(value) || value[0] !== dsId || !`${key}`.startsWith('displayConds')) return false;
        return true;
      },
    }),
  );

  watcher.collect(items, {}, true);

  const { deps } = watcher.getTarget(dsId, 'data-source');
  const { deps: condDeps } = watcher.getTarget(dsId, 'cond');

  if (!Object.keys(deps).length && !Object.keys(condDeps).length) {
    return items;
  }

  return items.map((item) => compliedIteratorItem({ itemData, data, dsId, keys, inEditor, condDeps, item, deps }));
};

const compliedIteratorItem = ({
  itemData,
  data,
  dsId,
  keys,
  inEditor,
  condDeps,
  item,
  deps,
}: {
  itemData: any;
  data: DataSourceManagerData;
  dsId: string;
  keys: string[];
  inEditor: boolean;
  condDeps: DepData;
  item: MNode;
  deps: DepData;
}) => {
  const { items, ...node } = item;
  const newNode = cloneDeep(node);

  if (items && !item.iteratorData) {
    newNode.items = Array.isArray(items)
      ? items.map((item) => compliedIteratorItem({ itemData, data, dsId, keys, inEditor, condDeps, item, deps }))
      : items;
  }

  if (Array.isArray(items) && items.length) {
    if (item.iteratorData) {
      newNode.items = items;
    } else {
      newNode.items = items.map((item) =>
        compliedIteratorItem({ itemData, data, dsId, keys, inEditor, condDeps, item, deps }),
      );
    }
  } else {
    newNode.items = items;
  }

  const ctxData = createIteratorContentData(itemData, dsId, keys, data);

  if (condDeps[newNode.id]?.keys.length && !inEditor) {
    newNode.condResult = compliedConditions(newNode, ctxData);
  }

  if (!deps[newNode.id]?.keys.length) {
    return newNode;
  }

  return compiledNode(
    (value: any) => compiledNodeField(value, ctxData),
    newNode,
    {
      [dsId]: deps,
    },
    dsId,
  );
};

/**
 * 按需加载数据源
 */
export const registerDataSourceOnDemand = async (
  dsl: MApp,
  dataSourceModules: Record<string, () => Promise<AsyncDataSourceResolveResult>>,
) => {
  const { dataSourceMethodsDeps = {}, dataSourceCondDeps = {}, dataSourceDeps = {}, dataSources = [] } = dsl;

  const dsModuleMap: Record<string, () => Promise<AsyncDataSourceResolveResult>> = {};

  dataSources.forEach((ds) => {
    let dep = dataSourceCondDeps[ds.id] || {};

    if (!Object.keys(dep).length) {
      dep = dataSourceDeps[ds.id] || {};
    }

    if (!Object.keys(dep).length) {
      dep = dataSourceMethodsDeps[ds.id] || {};
    }

    if (Object.keys(dep).length && dataSourceModules[ds.type]) {
      dsModuleMap[ds.type] = dataSourceModules[ds.type];
    }
  });

  const modules = await Promise.all(Object.values(dsModuleMap).map((asyncModule) => asyncModule()));

  const moduleMap: Record<string, any> = {};
  modules.forEach((module, index) => {
    const type = Object.keys(dsModuleMap)[index];
    moduleMap[type] = module.default;
  });

  return moduleMap;
};
