/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
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

import type { MApp, MContainer, MNode, MPage } from '@tmagic/schema';
import { NodeType } from '@tmagic/schema';
import type StageCore from '@tmagic/stage';
import { getNodePath, isNumber, isPage, isPop } from '@tmagic/utils';

import { Layout } from '../type';

export const COPY_STORAGE_KEY = '$MagicEditorCopyData';

/**
 * 获取所有页面配置
 * @param app DSL跟节点
 * @returns 所有页面配置
 */
export const getPageList = (app: MApp): MPage[] => {
  if (app.items && Array.isArray(app.items)) {
    return app.items.filter((item: MPage) => item.type === NodeType.PAGE);
  }
  return [];
};

/**
 * 获取所有页面名称
 * @param pages 所有页面配置
 * @returns 所有页面名称
 */
export const getPageNameList = (pages: MPage[]): string[] => pages.map((page: MPage) => page.name || 'index');

/**
 * 新增页面时，生成页面名称
 * @param {Object} pageNameList 所有页面名称
 * @returns {string}
 */
export const generatePageName = (pageNameList: string[]): string => {
  let pageLength = pageNameList.length;

  if (!pageLength) return 'index';

  let pageName = `page_${pageLength}`;
  while (pageNameList.includes(pageName)) {
    pageLength += 1;
    pageName = `page_${pageLength}`;
  }

  return pageName;
};

/**
 * 新增页面时，生成页面名称
 * @param {Object} app 所有页面配置
 * @returns {string}
 */
export const generatePageNameByApp = (app: MApp): string => generatePageName(getPageNameList(getPageList(app)));

/**
 * @param {Object} node
 * @returns {boolean}
 */
export const isFixed = (node: MNode): boolean => node.style?.position === 'fixed';

export const getNodeIndex = (node: MNode, parent: MContainer | MApp): number => {
  const items = parent?.items || [];
  return items.findIndex((item: MNode) => `${item.id}` === `${node.id}`);
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
    return {
      ...style,
      position: 'absolute',
    };
  }

  if (layout === Layout.RELATIVE) {
    return getRelativeStyle(style);
  }

  return style;
};

export const setLayout = (node: MNode, layout: Layout) => {
  node.items?.forEach((child: MNode) => {
    if (isPop(child)) return;

    const style = child.style || {};

    // 是 fixed 不做处理
    if (style.position === 'fixed') return;

    if (layout !== Layout.RELATIVE) {
      style.position = 'absolute';
    } else {
      child.style = getRelativeStyle(style);
      child.style.right = 'auto';
      child.style.bottom = 'auto';
    }
  });
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
