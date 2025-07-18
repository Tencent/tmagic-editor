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

import { detailedDiff } from 'deep-object-diff';
import { isObject } from 'lodash-es';
import serialize from 'serialize-javascript';

import type { Id, MApp, MContainer, MNode, MPage, MPageFragment } from '@tmagic/core';
import { NODE_CONDS_KEY, NodeType } from '@tmagic/core';
import type StageCore from '@tmagic/stage';
import {
  calcValueByFontsize,
  getElById,
  getNodePath,
  isNumber,
  isPage,
  isPageFragment,
  isPop,
  isValueIncludeDataSource,
} from '@tmagic/utils';

import { Layout } from '@editor/type';

export const COPY_STORAGE_KEY = '$MagicEditorCopyData';
export const COPY_CODE_STORAGE_KEY = '$MagicEditorCopyCode';
export const COPY_DS_STORAGE_KEY = '$MagicEditorCopyDataSource';

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

  let wrapperHeightDeal = parentHeight;
  if (stage.mask && stage.renderer) {
    // wrapperHeight 是未 calcValue的高度, 所以要将其calcValueByFontsize一下, 否则在pad or pc端计算的结果有误
    const { scrollTop = 0, wrapperHeight } = stage.mask;
    wrapperHeightDeal = calcValueByFontsize(stage.renderer.getDocument()!, wrapperHeight);
    const scrollTopDeal = calcValueByFontsize(stage.renderer.getDocument()!, scrollTop);
    if (isPage(parentNode)) {
      return (wrapperHeightDeal - height) / 2 + scrollTopDeal;
    }
  }

  // 如果容器的元素高度大于当前视口高度的2倍, 添加的元素居中位置也会看不见, 所以要取最小值计算
  return (Math.min(parentHeight, wrapperHeightDeal) - height) / 2;
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

  const el = getElById()(doc, `${config.id}`);
  const parentEl = getElById()(doc, `${parent.id}`);

  const left = Number(config.style?.left) || 0;
  if (el && parentEl) {
    const calcParentOffsetWidth = calcValueByFontsize(doc, parentEl.offsetWidth);
    const calcElOffsetWidth = calcValueByFontsize(doc, el.offsetWidth);
    if (calcElOffsetWidth + left > calcParentOffsetWidth) {
      return calcParentOffsetWidth - calcElOffsetWidth;
    }
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
    left: fixNodeLeft(config, parent, stage?.renderer?.contentWindow?.document),
  };
};

// 序列化配置
export const serializeConfig = (config: any) =>
  serialize(config, {
    space: 2,
    unsafe: true,
  }).replace(/"(\w+)":\s/g, '$1: ');

export const moveItemsInContainer = (sourceIndices: number[], parent: MContainer, targetIndex: number) => {
  sourceIndices.sort((a, b) => a - b);
  for (let i = sourceIndices.length - 1; i >= 0; i--) {
    const sourceIndex = sourceIndices[i];
    if (sourceIndex === targetIndex) {
      continue;
    }
    const [item] = parent.items.splice(sourceIndex, 1);
    parent.items.splice(sourceIndex < targetIndex ? targetIndex - 1 : targetIndex, 0, item);

    // 更新后续源索引（因为数组已经改变）
    for (let j = i - 1; j >= 0; j--) {
      if (sourceIndices[j] >= targetIndex) {
        sourceIndices[j] += 1;
      }
    }
  }
};

const isIncludeDataSourceByDiffAddResult = (diffResult: any) => {
  for (const value of Object.values(diffResult)) {
    const result = isValueIncludeDataSource(value);

    if (result) {
      return true;
    }

    if (isObject(value)) {
      return isIncludeDataSourceByDiffAddResult(value);
    }
  }
  return false;
};

const isIncludeDataSourceByDiffUpdatedResult = (diffResult: any, oldNode: any) => {
  for (const [key, value] of Object.entries<any>(diffResult)) {
    if (isValueIncludeDataSource(value)) {
      return true;
    }

    if (isValueIncludeDataSource(oldNode[key])) {
      return true;
    }

    if (isObject(value)) {
      return isIncludeDataSourceByDiffUpdatedResult(value, oldNode[key]);
    }
  }
  return false;
};

export const isIncludeDataSource = (node: MNode, oldNode: MNode) => {
  const diffResult = detailedDiff(oldNode, node);

  let isIncludeDataSource = false;

  if (diffResult.updated) {
    // 修改了显示条件
    if ((diffResult.updated as any)[NODE_CONDS_KEY]) {
      return true;
    }

    isIncludeDataSource = isIncludeDataSourceByDiffUpdatedResult(diffResult.updated, oldNode);
    if (isIncludeDataSource) return true;
  }

  if (diffResult.added) {
    isIncludeDataSource = isIncludeDataSourceByDiffAddResult(diffResult.added);
    if (isIncludeDataSource) return true;
  }

  if (diffResult.deleted) {
    // 删除了显示条件
    if ((diffResult.deleted as any)[NODE_CONDS_KEY]) {
      return true;
    }

    isIncludeDataSource = isIncludeDataSourceByDiffAddResult(diffResult.deleted);
    if (isIncludeDataSource) return true;
  }

  return isIncludeDataSource;
};
