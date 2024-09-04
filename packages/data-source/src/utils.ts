import { cloneDeep } from 'lodash-es';

import type { DepData, DisplayCond, DisplayCondItem, MApp, MNode, MPage, MPageFragment } from '@tmagic/core';
import {
  compiledCond,
  compiledNode,
  DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX,
  dataSourceTemplateRegExp,
  getValueByKeyPath,
  isPage,
  isPageFragment,
  NODE_CONDS_KEY,
  replaceChildNode,
} from '@tmagic/core';

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

    try {
      const fieldValue = getValueByKeyPath(fields.join('.'), dsData);

      if (!compiledCond(op, fieldValue, value, range)) {
        result = false;
        break;
      }
    } catch (e) {
      console.warn(e);
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
export const compliedConditions = (node: { [NODE_CONDS_KEY]?: DisplayCond[] }, data: DataSourceManagerData) => {
  if (!node[NODE_CONDS_KEY] || !Array.isArray(node[NODE_CONDS_KEY]) || !node[NODE_CONDS_KEY].length) return true;

  for (const { cond } of node[NODE_CONDS_KEY]) {
    if (!cond) continue;

    if (compiledCondition(cond, data)) {
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
  const data: DataSourceManagerData = {
    ...dsData,
    [dsId]: {},
  };

  let rawData = cloneDeep(dsData[dsId]);
  let obj: Record<string, any> = data[dsId];

  fields.forEach((key, index) => {
    Object.assign(obj, rawData);

    if (index === fields.length - 1) {
      obj[key] = itemData;
      return;
    }

    if (Array.isArray(rawData[key])) {
      rawData[key] = {};
      obj[key] = {};
    }

    rawData = rawData[key];
    obj = obj[key];
  });

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

    try {
      return getValueByKeyPath(fields.join('.'), dsData);
    } catch (e) {
      return value;
    }
  }

  return value;
};

export const template = (value: string, data?: DataSourceManagerData) =>
  value.replaceAll(dataSourceTemplateRegExp, (match, $1) => {
    try {
      return getValueByKeyPath($1, data);
    } catch (e: any) {
      return match;
    }
  });

/**
 * 编译通过tmagic-editor的数据源源选择器（data-source-input，data-source-select，data-source-field-select）配置出来的数据，或者其他符合规范的配置
 * @param value dsl节点中的数据源配置
 * @param data 数据源数据
 * @returns 编译好的配置
 */
export const compiledNodeField = (value: any, data: DataSourceManagerData) => {
  // 使用data-source-input等表单控件配置的字符串模板，如：`xxx${id.field}xxx`
  if (typeof value === 'string') {
    return template(value, data);
  }

  // 使用data-source-select等表单控件配置的数据源，如：{ isBindDataSource: true, dataSourceId: 'xxx'}
  if (value?.isBindDataSource && value.dataSourceId) {
    return data[value.dataSourceId];
  }

  // 指定数据源的字符串模板，如：{ isBindDataSourceField: true, dataSourceId: 'id', template: `xxx${field}xxx`}
  if (value?.isBindDataSourceField && value.dataSourceId && typeof value.template === 'string') {
    return template(value.template, data[value.dataSourceId]);
  }

  // 使用data-source-field-select等表单控件的数据源字段，如：[`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}${id}`, 'field']
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return compliedDataSourceField(value, data);
  }

  return value;
};

export const compliedIteratorItem = ({
  compile,
  dsId,
  item,
  deps,
  condDeps,
  inEditor,
  ctxData,
}: {
  compile: (value: any) => any;
  dsId: string;
  item: MNode;
  deps: DepData;
  condDeps: DepData;
  inEditor: boolean;
  ctxData: DataSourceManagerData;
}) => {
  const { items, ...node } = item;
  const newNode = cloneDeep(node);

  if (condDeps[node.id]?.keys.length && !inEditor) {
    newNode.condResult = compliedConditions(node, ctxData);
  }

  if (Array.isArray(items) && items.length) {
    newNode.items = items.map((item) =>
      compliedIteratorItem({ compile, dsId, item, deps, condDeps, inEditor, ctxData }),
    );
  } else if (items) {
    newNode.items = items;
  }

  if (!deps[newNode.id]?.keys.length) {
    return newNode;
  }

  return compiledNode(
    compile,
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
