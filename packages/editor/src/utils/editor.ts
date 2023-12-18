/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
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

import serialize from 'serialize-javascript';

import type { Id, MApp, MContainer, MNode, MPage, MPageFragment } from '@tmagic/schema';
import { NodeType } from '@tmagic/schema';
import type StageCore from '@tmagic/stage';
import { getNodePath, isNumber, isPage, isPageFragment, isPop } from '@tmagic/utils';

import { Layout } from '@editor/type';
export const COPY_STORAGE_KEY = '$MagicEditorCopyData';

/**
 * 获取所有页面配置
 * @param root DSL跟节点
 * @returns 所有页面配置
 */
export const getPageList = (root?: MApp | null): MPage[] => {
  if (!root) return [];
  if (!Array.isArray(root.items)) return [];
  return root.items.filter((item) => isPage(item)) as MPage[];
};

export const getPageFragmentList = (root?: MApp | null): MPageFragment[] => {
  if (!root) return [];
  if (!Array.isArray(root.items)) return [];
  return root.items.filter((item) => isPageFragment(item)) as MPageFragment[];
};

/**
 * 获取所有页面名称
 * @param pages 所有页面配置
 * @returns 所有页面名称
 */
export const getPageNameList = (pages: (MPage | MPageFragment)[]): string[] =>
  pages.map((page) => page.name || 'index');

/**
 * 新增页面时，生成页面名称
 * @param {Object} pageNameList 所有页面名称
 * @returns {string}
 */
export const generatePageName = (pageNameList: string[], type: NodeType.PAGE | NodeType.PAGE_FRAGMENT): string => {
  let pageLength = pageNameList.length;

  if (!pageLength) return `${type}_index`;

  let pageName = `${type}_${pageLength}`;
  while (pageNameList.includes(pageName)) {
    pageLength += 1;
    pageName = `${type}_${pageLength}`;
  }

  return pageName;
};

/**
 * 新增页面时，生成页面名称
 * @param {Object} app 所有页面配置
 * @returns {string}
 */
export const generatePageNameByApp = (app: MApp, type: NodeType.PAGE | NodeType.PAGE_FRAGMENT): string =>
  generatePageName(getPageNameList(type === 'page' ? getPageList(app) : getPageFragmentList(app)), type);

/**
 * @param {Object} node
 * @returns {boolean}
 */
export const isFixed = (node: MNode): boolean => node.style?.position === 'fixed';

export const getNodeIndex = (id: Id, parent: MContainer | MApp): number => {
  const items = parent?.items || [];
  return items.findIndex((item: MNode) => `${item.id}` === `${id}`);
};

export const getRelativeStyle = (style: Record<string, any> = {}): Record<string, any> => ({
  ...style,
  position: 'relative',
  top: 0,
  left: 0,
});

const getMiddleTop = (node: MNode, parentNode: MNode, stage: StageCore | null) => {
  let height = node.style?.height || 0;

  if (!stage || typeof node.style?.top !== 'undefined' || !parentNode.style) return node.style?.top;

  if (!isNumber(height)) {
    height = 0;
  }

  const { height: parentHeight } = parentNode.style;

  if (isPage(parentNode)) {
    const { scrollTop = 0, wrapperHeight } = stage.mask;
    return (wrapperHeight - height) / 2 + scrollTop;
  }

  return (parentHeight - height) / 2;
};

export const getInitPositionStyle = (style: Record<string, any> = {}, layout: Layout) => {
  if (layout === Layout.ABSOLUTE) {
    const newStyle: Record<string, any> = {
      ...style,
      position: 'absolute',
    };

    if (typeof newStyle.left === 'undefined' && typeof newStyle.right === 'undefined') {
      newStyle.left = 0;
    }

    return newStyle;
  }

  if (layout === Layout.RELATIVE) {
    return getRelativeStyle(style);
  }

  return style;
};

export const setChildrenLayout = (node: MContainer, layout: Layout) => {
  node.items?.forEach((child: MNode) => {
    setLayout(child, layout);
  });
  return node;
};

export const setLayout = (node: MNode, layout: Layout) => {
  if (isPop(node)) return;

  const style = node.style || {};

  // 是 fixed 不做处理
  if (style.position === 'fixed') return;

  if (layout !== Layout.RELATIVE) {
    style.position = 'absolute';
  } else {
    node.style = getRelativeStyle(style);
    node.style.right = 'auto';
    node.style.bottom = 'auto';
  }
  return node;
};

export const change2Fixed = (node: MNode, root: MApp) => {
  const path = getNodePath(node.id, root.items);
  const offset = {
    left: 0,
    top: 0,
  };

  path.forEach((value) => {
    offset.left = offset.left + globalThis.parseFloat(value.style?.left || 0);
    offset.top = offset.top + globalThis.parseFloat(value.style?.top || 0);
  });

  return {
    ...(node.style || {}),
    ...offset,
  };
};

export const Fixed2Other = async (
  node: MNode,
  root: MApp,
  getLayout: (parent: MNode, node?: MNode) => Promise<Layout>,
) => {
  const path = getNodePath(node.id, root.items);
  const cur = path.pop();
  const offset = {
    left: cur?.style?.left || 0,
    top: cur?.style?.top || 0,
    right: '',
    bottom: '',
  };

  path.forEach((value) => {
    offset.left = offset.left - globalThis.parseFloat(value.style?.left || 0);
    offset.top = offset.top - globalThis.parseFloat(value.style?.top || 0);
  });
  const style = node.style || {};

  const parent = path.pop();
  if (!parent) {
    return getRelativeStyle(style);
  }

  const layout = await getLayout(parent);
  if (layout !== Layout.RELATIVE) {
    return {
      ...style,
      ...offset,
      position: 'absolute',
    };
  }

  return getRelativeStyle(style);
};

export const getGuideLineFromCache = (key: string): number[] => {
  if (!key) return [];

  const guideLineCacheData = globalThis.localStorage.getItem(key);
  if (guideLineCacheData) {
    try {
      return JSON.parse(guideLineCacheData) || [];
    } catch (e) {
      console.error(e);
    }
  }

  return [];
};

export const fixNodeLeft = (config: MNode, parent: MContainer, doc?: Document) => {
  if (!doc || !config.style || !isNumber(config.style.left)) return config.style?.left;

  const el = doc.getElementById(`${config.id}`);
  const parentEl = doc.getElementById(`${parent.id}`);

  const left = Number(config.style?.left) || 0;
  if (el && parentEl && el.offsetWidth + left > parentEl.offsetWidth) {
    return parentEl.offsetWidth - el.offsetWidth;
  }

  return config.style.left;
};

export const fixNodePosition = (config: MNode, parent: MContainer, stage: StageCore | null) => {
  if (config.style?.position !== 'absolute') {
    return config.style;
  }

  return {
    ...(config.style || {}),
    top: getMiddleTop(config, parent, stage),
    left: fixNodeLeft(config, parent, stage?.renderer.contentWindow?.document),
  };
};

// 序列化配置
export const serializeConfig = (config: any) =>
  serialize(config, {
    space: 2,
    unsafe: true,
  }).replace(/"(\w+)":\s/g, '$1: ');

export interface NodeItem {
  items?: NodeItem[];
  [key: string]: any;
}

export const traverseNode = <T extends NodeItem = NodeItem>(
  node: T,
  cb: (node: T, parents: T[]) => void,
  parents: T[] = [],
) => {
  cb(node, parents);

  if (node.items?.length) {
    parents.push(node);
    node.items.forEach((item) => {
      traverseNode(item as T, cb, [...parents]);
    });
  }
};
