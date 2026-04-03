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
import { cloneDeep, get, isObject } from 'lodash-es';
import serialize from 'serialize-javascript';

import type { Id, MApp, MContainer, MNode, MPage, MPageFragment, TargetOptions } from '@tmagic/core';
import { NODE_CONDS_KEY, NodeType, Target, Watcher } from '@tmagic/core';
import type StageCore from '@tmagic/stage';
import { isFixed } from '@tmagic/stage';
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

import type { EditorNodeInfo } from '@editor/type';
import { LayerOffset, Layout } from '@editor/type';

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
  const style = {
    ...(node.style || {}),
  };

  const path = getNodePath(node.id, root.items);
  const offset = {
    left: 0,
    top: 0,
  };

  if (!node.style?.right && isNumber(node.style?.left || 0)) {
    for (const value of path) {
      if (value.style?.right || !isNumber(value.style?.left || 0)) {
        offset.left = 0;
        break;
      }
      offset.left = offset.left + Number(value.style?.left || 0);
    }
  }

  if (!node.style?.bottom && isNumber(node.style?.top || 0)) {
    for (const value of path) {
      if (value.style?.bottom || !isNumber(value.style?.top || 0)) {
        offset.top = 0;
        break;
      }
      offset.top = offset.top + Number(value.style?.top || 0);
    }
  }

  if (offset.left) {
    style.left = offset.left;
  }

  if (offset.top) {
    style.top = offset.top;
  }

  return style;
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
  };

  if (!node.style?.right && isNumber(node.style?.left || 0)) {
    for (const value of path) {
      if (value.style?.right || !isNumber(value.style?.left || 0)) {
        offset.left = 0;
        break;
      }
      offset.left = offset.left - Number(value.style?.left || 0);
    }
  }

  if (!node.style?.bottom && isNumber(node.style?.top || 0)) {
    for (const value of path) {
      if (value.style?.bottom || !isNumber(value.style?.top || 0)) {
        offset.top = 0;
        break;
      }
      offset.top = offset.top - Number(value.style?.top || 0);
    }
  }

  const style = node.style || {};

  const parent = path.pop();
  if (!parent) {
    return getRelativeStyle(style);
  }

  const layout = await getLayout(parent);
  if (layout !== Layout.RELATIVE) {
    if (offset.left) {
      style.left = offset.left;
    }

    if (offset.top) {
      style.top = offset.top;
    }

    return {
      ...style,
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

export const buildChangeRecords = (value: any, basePath: string) => {
  const changeRecords: { propPath: string; value: any }[] = [];

  // 递归构建 changeRecords
  const buildChangeRecords = (obj: any, basePath: string) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined) {
        const currentPath = basePath ? `${basePath}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // 递归处理嵌套对象
          buildChangeRecords(value, currentPath);
        } else {
          // 处理基础类型值
          changeRecords.push({ propPath: currentPath, value });
        }
      }
    });
  };

  buildChangeRecords(value, basePath);

  return changeRecords;
};

/**
 * 根据节点配置或ID解析出选中节点信息，并进行合法性校验
 * @param config 节点配置或节点ID
 * @param getNodeInfoFn 获取节点信息的回调函数
 * @param rootId 根节点ID，用于排除根节点被选中
 * @returns 选中节点的完整信息（node、parent、page）
 */
export const resolveSelectedNode = (
  config: MNode | Id,
  getNodeInfoFn: (id: Id) => EditorNodeInfo,
  rootId?: Id,
): EditorNodeInfo => {
  const id: Id = typeof config === 'string' || typeof config === 'number' ? config : config.id;

  if (!id) {
    throw new Error('没有ID，无法选中');
  }

  const { node, parent, page } = getNodeInfoFn(id);
  if (!node) throw new Error('获取不到组件信息');
  if (node.id === rootId) throw new Error('不能选根节点');

  return { node, parent, page };
};

/**
 * 处理节点在 fixed 定位与其他定位之间的切换
 * 当节点从非 fixed 变为 fixed 时，根据节点路径累加偏移量；反之则还原偏移量
 * @param dist 更新后的节点配置（目标状态）
 * @param src 更新前的节点配置（原始状态）
 * @param root 根节点配置，用于计算节点路径上的偏移量
 * @param getLayoutFn 获取父节点布局方式的回调函数
 * @returns 处理后的节点配置（深拷贝）
 */
export const toggleFixedPosition = async (
  dist: MNode,
  src: MNode,
  root: MApp,
  getLayoutFn: (parent: MNode, node?: MNode | null) => Promise<Layout>,
): Promise<MNode> => {
  const newConfig = cloneDeep(dist);

  if (!isPop(src) && newConfig.style?.position) {
    if (isFixed(newConfig.style) && !isFixed(src.style || {})) {
      newConfig.style = change2Fixed(newConfig, root);
    } else if (!isFixed(newConfig.style) && isFixed(src.style || {})) {
      newConfig.style = await Fixed2Other(newConfig, root, getLayoutFn);
    }
  }

  return newConfig;
};

/**
 * 根据键盘移动的偏移量计算节点的新样式
 * 仅对 absolute 或 fixed 定位的节点生效；优先修改 top/left，若未设置则修改 bottom/right
 * @param style 节点当前样式
 * @param left 水平方向偏移量（正值向右，负值向左）
 * @param top 垂直方向偏移量（正值向下，负值向上）
 * @returns 计算后的新样式对象，若节点不支持移动则返回 null
 */
export const calcMoveStyle = (style: Record<string, any>, left: number, top: number): Record<string, any> | null => {
  if (!style || !['absolute', 'fixed'].includes(style.position)) return null;

  const newStyle: Record<string, any> = { ...style };

  if (top) {
    if (isNumber(style.top)) {
      newStyle.top = Number(style.top) + Number(top);
      newStyle.bottom = '';
    } else if (isNumber(style.bottom)) {
      newStyle.bottom = Number(style.bottom) - Number(top);
      newStyle.top = '';
    }
  }

  if (left) {
    if (isNumber(style.left)) {
      newStyle.left = Number(style.left) + Number(left);
      newStyle.right = '';
    } else if (isNumber(style.right)) {
      newStyle.right = Number(style.right) - Number(left);
      newStyle.left = '';
    }
  }

  return newStyle;
};

/**
 * 计算节点水平居中对齐后的样式
 * 流式布局（relative）下不做处理；优先通过 DOM 元素实际宽度计算，回退到配置中的 width 值
 * @param node 需要居中的节点配置
 * @param parent 父容器节点配置
 * @param layout 当前布局方式
 * @param doc 画布 document 对象，用于获取 DOM 元素实际宽度
 * @returns 计算后的新样式对象，若不支持居中则返回 null
 */
export const calcAlignCenterStyle = (
  node: MNode,
  parent: MContainer,
  layout: Layout,
  doc?: Document,
): Record<string, any> | null => {
  if (layout === Layout.RELATIVE || !node.style) return null;

  const style = { ...node.style };

  if (doc) {
    const el = getElById()(doc, node.id);
    const parentEl = layout === Layout.FIXED ? doc.body : el?.offsetParent;
    if (parentEl && el) {
      style.left = calcValueByFontsize(doc, (parentEl.clientWidth - el.clientWidth) / 2);
      style.right = '';
    }
  } else if (parent.style && isNumber(parent.style?.width) && isNumber(node.style?.width)) {
    style.left = (parent.style.width - node.style.width) / 2;
    style.right = '';
  }

  return style;
};

/**
 * 计算图层移动后的目标索引
 * 流式布局与绝对定位布局的移动方向相反：流式布局中"上移"对应索引减小，绝对定位中"上移"对应索引增大
 * @param currentIndex 节点当前在兄弟列表中的索引
 * @param offset 移动偏移量，支持数值或 LayerOffset.TOP / LayerOffset.BOTTOM
 * @param brothersLength 兄弟节点总数
 * @param isRelative 是否为流式布局
 * @returns 目标索引位置
 */
export const calcLayerTargetIndex = (
  currentIndex: number,
  offset: number | LayerOffset,
  brothersLength: number,
  isRelative: boolean,
): number => {
  if (offset === LayerOffset.TOP) {
    return isRelative ? 0 : brothersLength;
  }
  if (offset === LayerOffset.BOTTOM) {
    return isRelative ? brothersLength : 0;
  }
  return currentIndex + (isRelative ? -(offset as number) : (offset as number));
};

/**
 * 节点配置合并策略：用于 mergeWith 的自定义回调
 * - undefined 且 source 拥有该 key 时返回空字符串
 * - 原来是数组而新值是对象时，使用新值
 * - 新值是数组时，直接替换而非逐元素合并
 */
export const editorNodeMergeCustomizer = (objValue: any, srcValue: any, key: string, _object: any, source: any) => {
  if (typeof srcValue === 'undefined' && Object.hasOwn(source, key)) {
    return '';
  }

  if (isObject(srcValue) && Array.isArray(objValue)) {
    return srcValue;
  }
  if (Array.isArray(srcValue)) {
    return srcValue;
  }
};

/**
 * 收集复制节点关联的依赖节点，将关联节点追加到 copyNodes 数组中
 * @param copyNodes 待复制的节点列表（会被就地修改）
 * @param collectorOptions 依赖收集器配置
 * @param getNodeById 根据 ID 获取节点的回调函数
 */
export const collectRelatedNodes = (
  copyNodes: MNode[],
  collectorOptions: TargetOptions,
  getNodeById: (id: Id) => MNode | null,
): void => {
  const customTarget = new Target({ ...collectorOptions });
  const coperWatcher = new Watcher();

  coperWatcher.addTarget(customTarget);
  coperWatcher.collect(copyNodes, {}, true, collectorOptions.type);

  Object.keys(customTarget.deps).forEach((nodeId: Id) => {
    const node = getNodeById(nodeId);
    if (!node) return;
    customTarget.deps[nodeId].keys.forEach((key) => {
      const relateNodeId = get(node, key);
      const isExist = copyNodes.find((n) => n.id === relateNodeId);
      if (!isExist) {
        const relateNode = getNodeById(relateNodeId);
        if (relateNode) {
          copyNodes.push(relateNode);
        }
      }
    });
  });
};

export interface DragClassification {
  sameParentIndices: number[];
  crossParentConfigs: { config: MNode; parent: MContainer }[];
  /** 当同父容器节点索引异常时置为 true，调用方应中止拖拽操作 */
  aborted: boolean;
}

/**
 * 对拖拽的节点进行分类：同父容器内移动 vs 跨容器移动
 * @param configs 被拖拽的节点列表
 * @param targetParent 目标父容器
 * @param getNodeInfo 获取节点信息的回调
 * @returns 分类结果，包含同容器索引列表和跨容器节点列表
 */
export const classifyDragSources = (
  configs: MNode[],
  targetParent: MContainer,
  getNodeInfo: (id: Id, raw?: boolean) => EditorNodeInfo,
): DragClassification => {
  const sameParentIndices: number[] = [];
  const crossParentConfigs: { config: MNode; parent: MContainer }[] = [];

  for (const config of configs) {
    const { parent, node: curNode } = getNodeInfo(config.id, false);
    if (!parent || !curNode) continue;

    const path = getNodePath(curNode.id, parent.items);
    if (path.some((node) => `${targetParent.id}` === `${node.id}`)) continue;

    const index = getNodeIndex(curNode.id, parent);

    if (`${parent.id}` === `${targetParent.id}`) {
      if (typeof index !== 'number' || index === -1) {
        return { sameParentIndices, crossParentConfigs, aborted: true };
      }
      sameParentIndices.push(index);
    } else {
      crossParentConfigs.push({ config, parent });
    }
  }

  return { sameParentIndices, crossParentConfigs, aborted: false };
};
