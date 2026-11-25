/* eslint-disable no-nested-ternary */
/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { cloneDeep, get as objectGet, set as objectSet } from 'lodash-es';

import type {
  DataSchema,
  DataSourceDeps,
  Id,
  MComponent,
  MContainer,
  MNode,
  MNodeInstance,
  MPage,
  MPageFragment,
} from '@tmagic/schema';
import { NodeType } from '@tmagic/schema';

import type { EditorNodeInfo } from '@editor/type';

import { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX } from './const';

export * from './dom';

export * from './const';

// for typeof global checks without @types/node
declare let global: {};

// eslint-disable-next-line @typescript-eslint/naming-convention
let _globalThis: any;
export const getGlobalThis = (): any =>
  _globalThis ||
  (_globalThis =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
        ? self
        : typeof window !== 'undefined'
          ? window
          : typeof global !== 'undefined'
            ? global
            : {});

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      resolve();
    }, ms);
  });

// 驼峰转换横线
export const toLine = (name = '') => name.replace(/\B([A-Z])/g, '-$1').toLowerCase();

export const toHump = (name = ''): string => name.replace(/-(\w)/g, (_all, letter) => letter.toUpperCase());

export const emptyFn = (): any => undefined;

/**
 * 通过id获取组件在应用的子孙路径
 * @param {number | string} id 组件id
 * @param {Array} data 要查找的根容器节点
 * @return {Array} 组件在data中的子孙路径
 */
export const getNodePath = (id: Id, data: MNode[] = [], skip?: MNode | null): MNode[] => {
  const path: MNode[] = [];
  // 目标 id 字符串只计算一次，避免在递归遍历中对每个节点重复拼接
  const targetId = `${id}`;

  const get = function (data: MNode[]): MNode | null {
    if (!Array.isArray(data)) {
      return null;
    }

    for (let i = 0, l = data.length; i < l; i++) {
      const item = data[i];

      path.push(item);
      if (`${item.id}` === targetId) {
        return item;
      }

      // skip 用于跳过已经搜索过的子树（如已优先搜索过的当前页面），避免重复遍历
      if (item.items && item !== skip) {
        const node = get(item.items);
        if (node) {
          return node;
        }
      }

      path.pop();
    }

    return null;
  };

  get(data);

  return path;
};

export const getNodeInfo = (id: Id, root: { id: Id; items?: MNode[] } | null, skip?: MNode | null) => {
  const info: EditorNodeInfo = {
    node: null,
    parent: null,
    page: null,
    path: [],
  };

  if (!root) return info;

  if (id === root.id) {
    info.node = root;
    return info;
  }

  const path = getNodePath(id, root.items, skip);
  info.path = path;

  if (!path.length) return info;

  path.unshift(root);

  info.node = path[path.length - 1] as MComponent;
  info.parent = path[path.length - 2] as MContainer;

  for (const item of path) {
    if (isPageOrFragment(item)) {
      info.page = item as MPage | MPageFragment;
      break;
    }
  }

  return info;
};

export const filterXSS = (str: string) =>
  str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/**
 * 把 url 拆成 path、query、hash 三段
 *
 * 没有直接用 URL 解析，是因为这里拿到的可能是不带协议的相对地址，
 * URL 会对它们做规范化编码，把原有的参数顺序和编码形式都改掉
 */
const splitUrl = (url: string) => {
  const hashIndex = url.indexOf('#');
  const hash = hashIndex > -1 ? url.slice(hashIndex) : '';
  const withoutHash = hashIndex > -1 ? url.slice(0, hashIndex) : url;
  const queryIndex = withoutHash.indexOf('?');

  return {
    path: queryIndex > -1 ? withoutHash.slice(0, queryIndex) : withoutHash,
    query: queryIndex > -1 ? withoutHash.slice(queryIndex + 1) : '',
    hasQuery: queryIndex > -1,
    hash,
  };
};

export const getUrlParam = (param: string, url?: string) => {
  const u = url || location.href;
  const { query } = splitUrl(u);

  let value = '';
  for (const pair of query.split('&')) {
    // 只按第一个 = 切分，值里出现的 = 要原样保留
    const eqIndex = pair.indexOf('=');
    // 用全等比较参数名：原来的正则没有转义，`a.b` 会匹配到 `axb`、`a[0]` 被当成字符组，
    // 且带了 i 标记，`id` 会匹配到 `ID`
    if ((eqIndex > -1 ? pair.slice(0, eqIndex) : pair) === param) {
      // 同名参数取最后一个，与原有行为保持一致
      value = eqIndex > -1 ? pair.slice(eqIndex + 1) : '';
    }
  }

  // 过滤XSS字符
  return filterXSS(value);
};

/**
 * 设置url中指定的参数
 *
 * @param {string}
 *          name [参数名]
 * @param {string}
 *          value [参数值]
 * @param {string}
 *          url [发生替换的url地址|默认为location.href]
 * @return {string} [返回处理后的url]
 */
export const setUrlParam = (name: string, value: string, url = globalThis.location.href) => {
  const { path, query, hash } = splitUrl(url);

  // 值里有 & = 空格等字符时不做编码会把 query 拆坏
  const extra = value ? `${name}=${encodeURIComponent(value)}` : '';

  let replaced = false;
  const params: string[] = [];

  for (const pair of query.split('&')) {
    if (!pair) {
      continue;
    }

    const eqIndex = pair.indexOf('=');
    if ((eqIndex > -1 ? pair.slice(0, eqIndex) : pair) !== name) {
      params.push(pair);
      continue;
    }

    // 同名参数只保留一个
    if (!replaced) {
      replaced = true;
      // 当原url中含有要替换的属性:value不为空时，仅对值做替换,为空时，直接把参数删除掉
      if (extra) {
        params.push(extra);
      }
    }
  }

  // 当原url中不含有要替换的属性且value值不为空时，追加到 query 末尾
  if (!replaced && extra) {
    params.push(extra);
  }

  // query 必须拼在 hash 前面，否则 `#section` 之后再挂 `?c=9` 就不是参数了
  return `${path}${params.length ? `?${params.join('&')}` : ''}${hash}`;
};

export const getSearchObj = (
  search = globalThis.location.search ? globalThis.location.search.substring(1) : '',
): Record<string, string> => {
  return search.split('&').reduce((obj, item) => {
    const [a, b = ''] = item.split('=');
    return { ...obj, [a]: b };
  }, {});
};

export const delQueStr = (url: string, ref: string[] | string) => {
  const { path, query, hasQuery, hash } = splitUrl(url);

  if (!hasQuery) {
    return url;
  }

  const isHit = Array.isArray(ref)
    ? function (v: string) {
        return ~ref.indexOf(v);
      }
    : function (v: string) {
        return v === ref;
      };

  const params = query.split('&').filter((pair) => {
    if (!pair) {
      return false;
    }

    // 只按第一个 = 切分：`token=YWJjZA==` 的值要整体保留，`flag` 这种没有值的参数
    // 也不能被拼成 `flag=undefined`
    const eqIndex = pair.indexOf('=');
    return !isHit(eqIndex > -1 ? pair.slice(0, eqIndex) : pair);
  });

  // 原来这里会丢掉 #hash
  return `${path}${params.length ? `?${params.join('&')}` : ''}${hash}`;
};

export const isObject = (obj: any) => Object.prototype.toString.call(obj) === '[object Object]';

export const isPop = (node: Pick<MComponent, 'type'> | null): boolean =>
  Boolean(node?.type?.toLowerCase().endsWith('pop'));

export const isPage = (node?: Pick<MComponent, 'type'> | null): boolean => {
  if (!node) return false;
  return Boolean(node.type?.toLowerCase() === NodeType.PAGE);
};

export const isPageFragment = (node?: Pick<MComponent, 'type'> | null): boolean => {
  if (!node) return false;
  return Boolean(node.type?.toLowerCase() === NodeType.PAGE_FRAGMENT);
};

/** 是否为页面或页面片 */
export const isPageOrFragment = (node?: Pick<MComponent, 'type'> | null): boolean =>
  isPage(node) || isPageFragment(node);

export const isNumber = (value: any) =>
  (typeof value === 'number' && !isNaN(value)) || /^(-?\d+)(\.\d+)?$/.test(`${value}`);

export const getHost = (targetUrl: string) => targetUrl.match(/\/\/([^/]+)/)?.[1];

export const isSameDomain = (targetUrl = '', source = globalThis.location.host) => {
  const isHttpUrl = /^(http[s]?:)?\/\//.test(targetUrl);

  if (!isHttpUrl) return true;

  return getHost(targetUrl) === source;
};

/**
 * 生成指定位数的GUID，无【-】格式
 * @param digit 位数，默认值8
 * @returns
 */
export const guid = (digit = 8): string =>
  'x'.repeat(digit).replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export const getKeysArray = (keys: string | number) =>
  // 将 array[0] 转成 array.0
  `${keys}`.replace(/\[(\d+)\]/g, '.$1').split('.');

/**
 * 判断某一层 key 是否为数组下标（纯数字）
 * @param key 单层 key
 * @returns 是否为数组下标
 */
export const isArrayIndex = (key: string | number): boolean => /^\d+$/.test(`${key}`);

export const getValueByKeyPath = (
  keys: number | string | string[] = '',
  data: Record<string | number, any> = {},
): any => {
  // 将 array[0] 转成 array.0
  const keyArray = Array.isArray(keys) ? keys : getKeysArray(keys);
  return keyArray.reduce((accumulator, currentValue: any) => {
    if (isObject(accumulator)) {
      return accumulator[currentValue];
    }

    if (Array.isArray(accumulator) && /^\d*$/.test(`${currentValue}`)) {
      return accumulator[currentValue];
    }

    throw new Error(`${data}中不存在${keys}`);
  }, data);
};

export const setValueByKeyPath = (keys: string | number, value: any, data: Record<string | number, any> = {}): any => {
  if (typeof value === 'undefined') {
    // 仅数组下标场景需要特殊处理：lodash 的 set 会把 undefined 写入数组得到 [undefined]，
    // 此处改为只创建父级空数组，避免出现 [undefined]。对象属性场景 undefined 会被 JSON 自然丢弃，保持原行为。
    // 注意：这里将「数字型末级 key」统一按数组下标处理，无法区分数字型对象 key，属于预期内的取舍。
    const keyArray = getKeysArray(keys);
    const lastKey = keyArray[keyArray.length - 1];
    if (keyArray.length > 1 && isArrayIndex(lastKey)) {
      const parentPath = keyArray.slice(0, -1).join('.');
      if (typeof objectGet(data, parentPath) === 'undefined') {
        objectSet(data, parentPath, []);
      }
      return data;
    }
  }
  return objectSet(data, keys, value);
};

/**
 * 按 id 获取节点（先序遍历顺序），找到的 id 会从传入的 ids 中移除。
 * 内部使用 Map 查找，并在所有 id 都找到后提前结束遍历
 */
export const getNodes = (ids: Id[], data: MNode[] = []): MNode[] => {
  const nodes: MNode[] = [];

  if (!ids.length) {
    return nodes;
  }

  // id -> 待查找的次数
  const remain = new Map<string, number>();
  for (const id of ids) {
    const key = `${id}`;
    remain.set(key, (remain.get(key) || 0) + 1);
  }
  let remainCount = ids.length;
  const used = new Map<string, number>();

  const get = function (data: MNode[]) {
    if (!Array.isArray(data)) {
      return;
    }

    for (const item of data) {
      if (!remainCount) {
        return;
      }

      const key = `${item.id}`;
      const count = remain.get(key);

      if (count) {
        remain.set(key, count - 1);
        used.set(key, (used.get(key) || 0) + 1);
        remainCount -= 1;
        nodes.push(item);
      }

      if (item.items) {
        get(item.items);
      }
    }
  };

  get(data);

  if (nodes.length) {
    // 保持原有行为：将已找到的 id 从 ids 中移除
    const rest: Id[] = [];
    for (const id of ids) {
      const key = `${id}`;
      const count = used.get(key);
      if (count) {
        used.set(key, count - 1);
      } else {
        rest.push(id);
      }
    }
    ids.length = 0;
    for (const id of rest) {
      ids.push(id);
    }
  }

  return nodes;
};

export const getDepKeys = (dataSourceDeps: DataSourceDeps = {}, nodeId: Id) =>
  Array.from(
    Object.values(dataSourceDeps).reduce((prev, cur) => {
      (cur[nodeId]?.keys || []).forEach((key) => prev.add(key));
      return prev;
    }, new Set<Id>()),
  );

export const getDepNodeIds = (dataSourceDeps: DataSourceDeps = {}) =>
  Array.from(
    Object.values(dataSourceDeps).reduce((prev, cur) => {
      Object.keys(cur).forEach((id) => {
        prev.add(id);
      });
      return prev;
    }, new Set<string>()),
  );

/**
 * 将新节点更新到data或者parentId对应的节点的子节点中
 * @param newNode 新节点
 * @param data 需要修改的数据
 * @param parentId 父节点 id
 */
export const replaceChildNode = (newNode: MNode, data?: MNode[], parentId?: Id): void => {
  const path = getNodePath(newNode.id, data);
  const node = path.pop();
  let parent = path.pop();

  if (parentId) {
    parent = getNodePath(parentId, data).pop();
  }

  if (!node) {
    console.warn(`未找到目标节点(${newNode.id})`);
    return;
  }

  if (!parent) {
    console.warn(`未找到父节点(${newNode.id})`);
    return;
  }

  const index = parent.items?.findIndex((child: MNode) => child.id === node.id);
  parent.items.splice(index, 1, newNode);
};

/**
 * 批量将新节点更新到data中对应id的节点位置，效果等同于依次调用 replaceChildNode，
 * 但只需遍历一次树来定位所有节点，避免每个节点都做一次全树搜索（O(K*N) -> O(N+K)）
 * @param newNodes 新节点列表
 * @param data 需要修改的数据
 */
export const replaceChildNodes = (newNodes: MNode[], data: MNode[] = []): void => {
  if (!newNodes.length) {
    return;
  }

  interface Location {
    /** 节点所在的数组，undefined 表示节点在 data 顶层（没有父节点） */
    container?: MNode[];
    index: number;
    node: MNode;
    /** 节点在树中的层级，data 顶层为 0 */
    depth: number;
  }

  const locate = (nodes: MNode[]) => {
    const ids = new Set(nodes.map((node) => `${node.id}`));
    const locations = new Map<string, Location>();

    const walk = (list: MNode[], depth: number) => {
      for (let i = 0, l = list.length; i < l; i++) {
        if (locations.size === ids.size) {
          return;
        }

        const item = list[i];
        const key = `${item.id}`;

        if (ids.has(key) && !locations.has(key)) {
          locations.set(key, { container: depth === 0 ? undefined : list, index: i, node: item, depth });
        }

        if (Array.isArray(item.items)) {
          walk(item.items, depth + 1);
        }
      }
    };

    if (Array.isArray(data)) {
      walk(data, 0);
    }

    return locations;
  };

  let locations = locate(newNodes);

  // 层级浅的先替换（父节点先于子节点），避免先替换了子节点后，父节点的新数据中仍是旧的子节点而把子节点的更新覆盖掉；
  // 同一层级保持传入顺序，未找到的节点排在最后
  const sortedNodes = newNodes
    .map((node, order) => ({ node, order, depth: locations.get(`${node.id}`)?.depth ?? Infinity }))
    .sort((a, b) => (a.depth === b.depth ? a.order - b.order : a.depth - b.depth))
    .map(({ node }) => node);

  for (let i = 0, l = sortedNodes.length; i < l; i++) {
    const newNode = sortedNodes[i];
    const location = locations.get(`${newNode.id}`);

    if (!location) {
      console.warn(`未找到目标节点(${newNode.id})`);
      continue;
    }

    const { container, node } = location;

    if (!container) {
      console.warn(`未找到父节点(${newNode.id})`);
      continue;
    }

    let { index } = location;
    if (container[index]?.id !== node.id) {
      index = container.findIndex((child: MNode) => child.id === node.id);
    }

    if (index === -1) {
      console.warn(`未找到目标节点(${newNode.id})`);
      continue;
    }

    const oldItems = node.items;
    container.splice(index, 1, newNode);

    // 新节点的 items 不是原来的数组时，后续节点的位置信息可能失效，需要重新定位
    if (newNode.items !== oldItems && i < l - 1) {
      locations = locate(sortedNodes.slice(i + 1));
    }
  }
};

export const DSL_NODE_KEY_COPY_PREFIX = '__tmagic__';
export const IS_DSL_NODE_KEY = '__tmagic__dslNode';
export const PAGE_FRAGMENT_CONTAINER_ID_KEY = 'tmagic-page-fragment-container-id';

export const compiledNode = (
  compile: (value: any) => any,
  node: MNode,
  dataSourceDeps: DataSourceDeps = {},
  sourceId?: Id,
) => {
  let keys: Id[] = [];
  if (!sourceId) {
    keys = getDepKeys(dataSourceDeps, node.id);
  } else {
    const dep = dataSourceDeps[sourceId];
    keys = dep?.[node.id]?.keys || [];
  }

  keys.forEach((key) => {
    const keys = getKeysArray(key);

    const cacheKey = keys.map((key, index) => {
      if (index < keys.length - 1) {
        return key;
      }
      return `${DSL_NODE_KEY_COPY_PREFIX}${key}`;
    });

    let templateValue = getValueByKeyPath(cacheKey, node);
    if (typeof templateValue === 'undefined') {
      try {
        const value = getValueByKeyPath(key, node);
        setValueByKeyPath(cacheKey.join('.'), value, node);
        templateValue = value;
      } catch (e) {
        console.warn(e);
        return;
      }
    }

    let newValue;
    try {
      newValue = compile(templateValue);
    } catch (e) {
      console.error(e);
      newValue = '';
    }

    setValueByKeyPath(key, newValue, node);
  });

  return node;
};

export const compiledCond = (op: string, fieldValue: any, inputValue: any, range: number[] = []): boolean => {
  if (typeof fieldValue === 'string' && typeof inputValue === 'undefined') {
    inputValue = '';
  }

  switch (op) {
    case 'is':
      return fieldValue === inputValue;
    case 'not':
      return fieldValue !== inputValue;
    case '=':
      return fieldValue === inputValue;
    case '!=':
      return fieldValue !== inputValue;
    case '>':
      return fieldValue > inputValue;
    case '>=':
      return fieldValue >= inputValue;
    case '<':
      return fieldValue < inputValue;
    case '<=':
      return fieldValue <= inputValue;
    case 'between':
      return range.length > 1 && fieldValue >= range[0] && fieldValue <= range[1];
    case 'not_between':
      return range.length < 2 || fieldValue < range[0] || fieldValue > range[1];
    case 'include':
      return fieldValue?.includes?.(inputValue);
    case 'not_include':
      return typeof fieldValue === 'undefined' || !fieldValue.includes?.(inputValue);
    default:
      break;
  }

  return false;
};

export const getDefaultValueFromFields = (fields: DataSchema[]) => {
  const data: Record<string, any> = {};

  const defaultValue: Record<string, any> = {
    string: undefined,
    object: {},
    array: [],
    boolean: undefined,
    number: undefined,
    null: null,
    any: undefined,
  };

  fields.forEach((field) => {
    if (typeof field.defaultValue !== 'undefined') {
      if (field.type === 'array' && !Array.isArray(field.defaultValue)) {
        data[field.name] = defaultValue.array;
        return;
      }

      if (field.type === 'object' && !isObject(field.defaultValue)) {
        if (typeof field.defaultValue === 'string') {
          try {
            data[field.name] = JSON.parse(field.defaultValue);
          } catch (e) {
            data[field.name] = defaultValue.object;
            console.warn('defaultValue 解析失败', field.defaultValue, e);
          }
          return;
        }

        data[field.name] = defaultValue.object;
        return;
      }

      data[field.name] = cloneDeep(field.defaultValue);

      return;
    }

    if (field.type === 'object') {
      data[field.name] = field.fields ? getDefaultValueFromFields(field.fields) : defaultValue.object;
      return;
    }

    if (field.type) {
      data[field.name] = defaultValue[field.type];
      return;
    }

    data[field.name] = undefined;
  });

  return data;
};

export const getKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;

export const calculatePercentage = (value: number, percentageStr: string) => {
  const percentage = globalThis.parseFloat(percentageStr) / 100; // 先将百分比字符串转换为浮点数，并除以100转换为小数
  const result = value * percentage;
  return result;
};

export const isPercentage = (value: number | string) => /^(\d+)(\.\d+)?%$/.test(`${value}`);

export const convertToNumber = (value: number | string, parentValue = 0) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && isPercentage(value)) {
    return calculatePercentage(parentValue, value);
  }

  return parseFloat(value);
};

/**
 * 添加参数到URL
 * @param obj 参数对象
 * @param global window对象
 * @param needReload 是否需要刷新
 */
export const addParamToUrl = (obj: Record<string, any>, global = globalThis, needReload = true) => {
  const url = new URL(global.location.href);
  const { searchParams } = url;
  for (const [k, v] of Object.entries(obj)) {
    searchParams.set(k, v);
  }
  const newUrl = url.toString();
  if (needReload) {
    global.location.href = newUrl;
  } else {
    global.history.pushState({}, '', url);
  }
};

export const dataSourceTemplateRegExp = /\$\{([\s\S]+?)\}/g;

export const isDslNode = (config: MNodeInstance) =>
  typeof config[IS_DSL_NODE_KEY] === 'undefined' || config[IS_DSL_NODE_KEY] === true;

export interface NodeItem {
  items?: NodeItem[];
  [key: string]: any;
}

export const traverseNode = <T extends NodeItem = NodeItem>(
  node: T,
  cb: (node: T, parents: T[]) => void,
  parents: T[] = [],
  evalCbAfter = false,
) => {
  if (!evalCbAfter) {
    cb(node, parents);
  }

  if (Array.isArray(node.items) && node.items.length) {
    parents.push(node);
    node.items.forEach((item) => {
      traverseNode(item as T, cb, [...parents], evalCbAfter);
    });
  }

  if (evalCbAfter) {
    cb(node, parents);
  }
};

export const isValueIncludeDataSource = (value: any) => {
  if (typeof value === 'string' && /\$\{([\s\S]+?)\}/.test(value)) {
    return true;
  }
  if (Array.isArray(value) && `${value[0]}`.startsWith(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX)) {
    return true;
  }
  if (value?.isBindDataSource && value.dataSourceId) {
    return true;
  }
  if (value?.isBindDataSourceField && value.dataSourceId) {
    return true;
  }
  return false;
};

export const removeDataSourceFieldPrefix = (id?: string) =>
  id?.replace(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX, '') || '';
