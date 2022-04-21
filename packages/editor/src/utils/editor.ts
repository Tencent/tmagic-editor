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

import { random } from 'lodash-es';

import type { Id, MApp, MContainer, MNode, MPage } from '@tmagic/schema';
import { NodeType } from '@tmagic/schema';
import type StageCore from '@tmagic/stage';
import { getNodePath, isNumber, isPage, isPop } from '@tmagic/utils';

import { Layout } from '@editor/type';

export const COPY_STORAGE_KEY = '$MagicEditorCopyData';

export const generateId = (type: string | number): string => `${type}_${random(10000, false)}`;

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
 * 复制页面时，需要把组件下关联的弹窗id换测复制出来的弹窗的id
 * @param {number} oldId 复制的源弹窗id
 * @param {number} popId 新的弹窗id
 * @param {Object} pageConfig 页面配置
 */
const updatePopId = (oldId: Id, popId: Id, pageConfig: MPage) => {
  pageConfig.items?.forEach((config) => {
    if (config.pop === oldId) {
      config.pop = popId;
      return;
    }

    if (config.popId === oldId) {
      config.popId = popId;
      return;
    }

    if (Array.isArray(config.items)) {
      updatePopId(oldId, popId, config as MPage);
    }
  });
};

/**
 * 将组件与组件的子元素配置中的id都设置成一个新的ID
 * @param {Object} config 组件配置
 */
/* eslint no-param-reassign: ["error", { "props": false }] */
export const setNewItemId = (config: MNode, parent?: MPage) => {
  const oldId = config.id;

  config.id = generateId(config.type || 'component');
  config.name = `${config.name?.replace(/_(\d+)$/, '')}_${config.id}`;

  // 只有弹窗在页面下的一级子元素才有效
  if (isPop(config) && parent?.type === NodeType.PAGE) {
    updatePopId(oldId, config.id, parent);
  }

  if (config.items && Array.isArray(config.items)) {
    config.items.forEach((item) => setNewItemId(item, config as MPage));
  }
};

/**
 * @param {Object} node
 * @returns {boolean}
 */
export const isFixed = (node: MNode): boolean => node.style?.position === 'fixed';

export const getNodeIndex = (node: MNode, parent: MContainer): number => {
  const items = parent?.items || [];
  return items.findIndex((item: MNode) => `${item.id}` === `${node.id}`);
};

export const toRelative = (node: MNode) => {
  node.style = {
    ...(node.style || {}),
    position: 'relative',
    top: 0,
    left: 0,
  };
  return node;
};

const setTop2Middle = (node: MNode, parentNode: MNode, stage: StageCore) => {
  const style = node.style || {};
  const height = style.height || 0;

  if (!stage || style.top || !parentNode.style || !isNumber(height)) return style;

  const { height: parentHeight } = parentNode.style;

  if (isPage(parentNode)) {
    const { scrollTop = 0, wrapperHeight } = stage.mask;
    style.top = (wrapperHeight - height) / 2 + scrollTop;
  } else {
    style.top = (parentHeight - height) / 2;
  }

  return style;
};

export const initPosition = (node: MNode, layout: Layout, parentNode: MNode, stage: StageCore) => {
  if (layout === Layout.ABSOLUTE) {
    node.style = {
      position: 'absolute',
      ...setTop2Middle(node, parentNode, stage),
    };
    return node;
  }

  if (layout === Layout.RELATIVE) {
    return toRelative(node);
  }

  return node;
};

export const setLayout = (node: MNode, layout: Layout) => {
  node.items?.forEach((child: MNode) => {
    if (isPop(child)) return;

    child.style = child.style || {};

    // 是 fixed 不做处理
    if (child.style.position === 'fixed') return;

    if (layout !== Layout.RELATIVE) {
      child.style.position = 'absolute';
    } else {
      toRelative(child);
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

  node.style = {
    ...(node.style || {}),
    ...offset,
  };
  return node;
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

  const parent = path.pop();
  if (!parent) {
    return toRelative(node);
  }

  const layout = await getLayout(parent);
  if (layout !== Layout.RELATIVE) {
    node.style = {
      ...(node.style || {}),
      ...offset,
      position: 'absolute',
    };
    return node;
  }

  return toRelative(node);
};
