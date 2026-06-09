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

import { reactive, toRaw } from 'vue';
import { cloneDeep, isObject, mergeWith, uniq } from 'lodash-es';

import type { Id, MApp, MContainer, MNode, MPage, MPageFragment, TargetOptions } from '@tmagic/core';
import { NodeType } from '@tmagic/core';
import type { ChangeRecord } from '@tmagic/form';
import { isFixed } from '@tmagic/stage';
import {
  getNodeInfo,
  getNodePath,
  getValueByKeyPath,
  guid,
  isPage,
  isPageFragment,
  setValueByKeyPath,
} from '@tmagic/utils';

import BaseService from '@editor/services//BaseService';
import propsService from '@editor/services//props';
import historyService from '@editor/services/history';
import storageService, { Protocol } from '@editor/services/storage';
import type {
  AddMNode,
  AsyncHookPlugin,
  AsyncMethodName,
  DslOpOptions,
  EditorEvents,
  EditorNodeInfo,
  HistoryOpSource,
  HistoryOpType,
  PastePosition,
  StepDiffItem,
  StepValue,
  StoreState,
  StoreStateKey,
} from '@editor/type';
import { canUsePluginMethods, LayerOffset, Layout } from '@editor/type';
import {
  calcAlignCenterStyle,
  calcLayerTargetIndex,
  calcMoveStyle,
  classifyDragSources,
  collectRelatedNodes,
  COPY_STORAGE_KEY,
  editorNodeMergeCustomizer,
  fixNodePosition,
  getInitPositionStyle,
  getNodeIndex,
  getPageFragmentList,
  getPageList,
  moveItemsInContainer,
  resolveSelectedNode,
  setChildrenLayout,
  setLayout,
  toggleFixedPosition,
} from '@editor/utils/editor';
import { beforePaste, getAddParent } from '@editor/utils/operator';

type MoveItem = { node: MNode; parent: MContainer; pageForOp: { name: string; id: Id } | null };

/**
 * 给「回滚」生成的新 step 用的简短描述生成器。
 * 与 UI 层 `describePageStep` 同义，但避免 service 反向依赖 layouts/，故在此本地实现。
 */
const describeStepForRevert = (step: StepValue): string => {
  const items = step.diff ?? [];
  // 在可读名后拼接组件 id，便于在历史面板中精确定位被回滚的组件；id 缺失时退化为仅展示名称。
  const withId = (node: MNode | undefined, label: string): string => {
    const id = node?.id;
    if (id === undefined || id === null || `${id}` === '') return label;
    return label ? `${label}（id: ${id}）` : `id: ${id}`;
  };
  switch (step.opType) {
    case 'add': {
      const count = items.length;
      const node = items[0]?.newSchema;
      const label = node?.name || node?.type || '';
      return `撤回新增 ${count} 个节点${count === 1 ? `（${withId(node, label)}）` : ''}`;
    }
    case 'remove': {
      const count = items.length;
      const node = items[0]?.oldSchema;
      const label = node?.name || node?.type || '';
      return `还原已删除的 ${count} 个节点${count === 1 ? `（${withId(node, label)}）` : ''}`;
    }
    case 'update':
    default: {
      if (items.length === 1) {
        const { newSchema, oldSchema, changeRecords } = items[0];
        const node = newSchema || oldSchema;
        const label = newSchema?.name || newSchema?.type || oldSchema?.name || oldSchema?.type || '';
        const target = withId(node, label);
        const propPath = changeRecords?.[0]?.propPath;
        return propPath ? `还原 ${target} · ${propPath}` : `还原 ${target}`;
      }
      return `还原 ${items.length} 个节点的修改`;
    }
  }
};

/**
 * 把「变更前后节点快照」列表归一成 update 类型的 {@link StepDiffItem} 列表，供 {@link StepValue.diff} 使用。
 * `changeRecords` 来自 form 端的 propPath/value 列表，撤销/重做时只对这些 propPath 做局部更新；
 * 缺省（未传 / 空数组）才退化为整节点替换。
 */
const buildUpdateDiff = (
  items: { oldNode: MNode; newNode: MNode; changeRecords?: ChangeRecord[] }[],
): StepDiffItem<MNode>[] =>
  items.map(({ oldNode, newNode, changeRecords }) => ({
    oldSchema: oldNode,
    newSchema: newNode,
    ...(changeRecords?.length ? { changeRecords } : {}),
  }));

class Editor extends BaseService {
  public state: StoreState = reactive({
    root: null,
    page: null,
    parent: null,
    node: null,
    nodes: [],
    stage: null,
    stageLoading: true,
    highlightNode: null,
    modifiedNodeIds: new Map(),
    pageLength: 0,
    pageFragmentLength: 0,
    disabledMultiSelect: false,
    alwaysMultiSelect: false,
  });
  private selectionBeforeOp: Id[] | null = null;
  /**
   * 最近一次 pushOpHistory 写入的历史记录 uuid。
   * 供 *AndGetHistoryId 系列方法在调用普通操作后取回本次产生的历史记录 id；
   * 普通操作不会读取它，调用前由 *AndGetHistoryId 重置为 null。
   */
  private lastPushedHistoryId: string | null = null;

  constructor() {
    super(
      canUsePluginMethods.async.map((methodName) => ({ name: methodName, isAsync: true })),
      // 需要注意循环依赖问题，如果函数间有相互调用的话，不能设置为串行调用
      ['select', 'update', 'moveLayer'],
    );
  }

  /**
   * 设置当前指点节点配置
   * @param name 'root' | 'page' | 'parent' | 'node' | 'highlightNode' | 'nodes' | 'stage' | 'modifiedNodeIds' | 'pageLength' | 'pageFragmentLength
   * @param value MNode
   */
  public set<K extends StoreStateKey, T extends StoreState[K]>(name: K, value: T) {
    const preValue = this.state[name];
    this.state[name] = value;

    // set nodes时将node设置为nodes第一个元素
    if (name === 'nodes' && Array.isArray(value)) {
      this.set('node', value[0]);
    }

    if (name === 'root') {
      if (Array.isArray(value)) {
        throw new Error('root 不能为数组');
      }

      if (value && isObject(value)) {
        const app = value as MApp;
        this.state.pageLength = getPageList(app).length || 0;
        this.state.pageFragmentLength = getPageFragmentList(app).length || 0;
        this.state.stageLoading = this.state.pageLength !== 0;
      } else {
        this.state.pageLength = 0;
        this.state.pageFragmentLength = 0;
        this.state.stageLoading = false;
      }

      this.emit('root-change', value as StoreState['root'], preValue as StoreState['root']);
    }
  }

  /**
   * 获取当前指点节点配置
   * @param name  'root' | 'page' | 'parent' | 'node' | 'highlightNode' | 'nodes' | 'stage' | 'modifiedNodeIds' | 'pageLength' | 'pageFragmentLength'
   * @returns MNode
   */
  public get<K extends StoreStateKey>(name: K): StoreState[K] {
    return this.state[name];
  }

  /**
   * 根据id获取组件、组件的父组件以及组件所属的页面节点
   * @param {number | string} id 组件id
   * @param {boolean} raw 是否使用toRaw
   * @returns {EditorNodeInfo}
   */
  public getNodeInfo(id: Id, raw = true): EditorNodeInfo {
    let root = this.get('root');
    if (raw) {
      root = toRaw(root);
    }

    if (!root) {
      return { node: null, parent: null, page: null };
    }

    if (id === root.id) {
      return { node: root, parent: null, page: null };
    }

    // 大多数查找的目标都在当前页面内，优先在当前页面子树中查找以避免对整棵树做全量遍历。
    // 注意：不能直接使用 state.page，它可能与当前 root 不同步（指向已脱离的旧页面对象），
    // 因此仅借用其 id，再从当前 root 中取回真正的页面对象（页面均为 root 的直接子节点，数量很少）。
    const pageIdStr = `${this.get('page')?.id || ''}`;
    const currentPageNode = root.items?.find((item) => `${item.id}` === pageIdStr);
    if (currentPageNode && `${id}` !== pageIdStr) {
      // util 仅读取 root.id 与 root.items，按容器结构传入当前页面是安全的
      const info = getNodeInfo(id, currentPageNode);
      if (info.node) {
        return info;
      }
    }

    // 回退：在完整 root 上查找；当前页面已搜索过，用 skip 跳过其子树避免重复遍历，
    // 同时保留真实的 parent / page 引用（id 命中当前页面节点本身时会在跳过子树前先匹配到）
    return getNodeInfo(id, root, currentPageNode);
  }

  /**
   * 根据ID获取指点节点配置
   * @param id 组件ID
   * @param {boolean} raw 是否使用toRaw
   * @returns 组件节点配置
   */
  public getNodeById(id: Id, raw = true): MNode | null {
    const { node } = this.getNodeInfo(id, raw);
    return node;
  }

  /**
   * 根据ID获取指点节点的父节点配置
   * @param id 组件ID
   * @param {boolean} raw 是否使用toRaw
   * @returns 指点组件的父节点配置
   */
  public getParentById(id: Id, raw = true): MContainer | null {
    const { parent } = this.getNodeInfo(id, raw);
    return parent;
  }

  /**
   * 判断给定节点是否位于非当前页面（即选中该节点将会引起当前页面切换）
   * @param node 节点
   * @returns true 表示该节点位于非当前页面
   */
  public isOnDifferentPage(node: MNode): boolean {
    const currentPageId = this.get('page')?.id;
    if (currentPageId === undefined || currentPageId === null) return false;
    if (isPage(node) || isPageFragment(node)) {
      return `${node.id}` !== `${currentPageId}`;
    }
    const nodePage = this.getNodeInfo(node.id, false).page;
    if (!nodePage) return false;
    return `${nodePage.id}` !== `${currentPageId}`;
  }

  /**
   * 只有容器拥有布局
   */
  public async getLayout(parent: MNode, node?: MNode | null): Promise<Layout> {
    if (node && isFixed(node.style || {})) return Layout.FIXED;

    if (parent.layout) {
      return parent.layout;
    }

    // 如果该节点没有设置position，则认为是流式布局，例如获取root的布局时
    if (!parent.style?.position) {
      return Layout.RELATIVE;
    }

    return Layout.ABSOLUTE;
  }

  /**
   * 选中指定节点（将指定节点设置成当前选中状态）
   * @param config 指定节点配置或者ID
   * @returns 当前选中的节点配置
   */
  public async select(config: MNode | Id): Promise<MNode> | never {
    const { node, page, parent } = this.selectedConfigExceptionHandler(config);
    this.set('nodes', node ? [node] : []);
    this.set('page', page);
    this.set('parent', parent);

    if (page) {
      historyService.changePage(toRaw(page));
    } else {
      historyService.resetState();
    }

    if (node?.id) {
      this.get('stage')
        ?.renderer?.runtime?.getApp?.()
        ?.page?.emit(
          'editor:select',
          {
            node,
            page,
            parent,
          },
          getNodePath(node.id, this.get('root')?.items),
        );
    }

    this.emit('select', node);

    return node!;
  }

  public async selectNextNode(): Promise<MNode | null> | never {
    const node = toRaw(this.get('node'));

    if (!node || isPage(node) || node.type === NodeType.ROOT) return node;

    const parent = toRaw(this.getParentById(node.id));

    if (!parent) return node;

    const index = getNodeIndex(node.id, parent);

    const nextNode = parent.items[index + 1] || parent.items[0];

    await this.select(nextNode);
    this.get('stage')?.select(nextNode.id);

    return nextNode;
  }

  public async selectNextPage(): Promise<MNode> | never {
    const root = toRaw(this.get('root'));
    const page = toRaw(this.get('page'));

    if (!page) throw new Error('page不能为空');
    if (!root) throw new Error('root不能为空');

    const index = getNodeIndex(page.id, root);

    const nextPage = root.items[index + 1] || root.items[0];

    await this.select(nextPage);
    this.get('stage')?.select(nextPage.id);

    return nextPage;
  }

  /**
   * 高亮指定节点
   * @param config 指定节点配置或者ID
   * @returns 当前高亮的节点配置
   */
  public highlight(config: MNode | Id): void {
    const { node } = this.selectedConfigExceptionHandler(config);
    const currentHighlightNode = this.get('highlightNode');
    if (currentHighlightNode === node) return;
    this.set('highlightNode', node);
  }

  /**
   * 多选
   * @param ids 指定节点ID
   * @returns 加入多选的节点配置
   */
  public multiSelect(ids: Id[]): void {
    const nodes: MNode[] = [];
    const idsUnique = uniq(ids);
    idsUnique.forEach((id) => {
      const { node } = this.getNodeInfo(id);
      if (!node) return;
      nodes.push(node);
    });
    this.set('nodes', nodes);
  }

  public selectRoot() {
    const root = this.get('root');
    if (!root) return;

    this.set('nodes', [root]);
    this.set('parent', null);
    this.set('page', null);
    this.set('stage', null);
    this.set('highlightNode', null);
  }

  public async doAdd(node: MNode, parent: MContainer): Promise<MNode> {
    const root = this.get('root');

    if (!root) throw new Error('root为空');

    const curNode = this.get('node');
    const stage = this.get('stage');

    if (!curNode) throw new Error('当前选中节点为空');

    if ((parent.type === NodeType.ROOT || curNode?.type === NodeType.ROOT) && !(isPage(node) || isPageFragment(node))) {
      throw new Error('app下不能添加组件');
    }

    if (parent.id !== curNode.id && !(isPage(node) || isPageFragment(node))) {
      const index = parent.items.indexOf(curNode);
      parent.items?.splice(index + 1, 0, node);
    } else {
      // 新增节点添加到配置中
      parent.items?.push(node);
    }

    const layout = await this.getLayout(toRaw(parent), node as MNode);
    node.style = getInitPositionStyle(node.style, layout);

    await stage?.add({
      config: cloneDeep(node),
      parent: cloneDeep(parent),
      parentId: parent.id,
      root: cloneDeep(root),
    });

    const newStyle = fixNodePosition(node, parent, stage);

    if (newStyle && (newStyle.top !== node.style.top || newStyle.left !== node.style.left)) {
      node.style = newStyle;
      await stage?.update({ config: cloneDeep(node), parentId: parent.id, root: cloneDeep(root) });
    }

    this.addModifiedNodeId(node.id);

    return node;
  }

  /**
   * 向指点容器添加组件节点
   * @param addConfig 将要添加的组件节点配置
   * @param parent 要添加到的容器组件节点配置，如果不设置，默认为当前选中的组件的父节点
   * @param options 可选配置
   * @param options.doNotSelect 添加后是否不更新当前选中节点（默认 false，添加后会选中新增的节点）
   * @param options.doNotSwitchPage 添加后是否不切换当前页面（默认 false；新增页面 / 跨页新增时为 true 会跳过会引发页面切换的选中操作）
   * @param options.doNotPushHistory 是否不写入历史记录（默认 false）
   * @returns 添加后的节点
   */
  public async add(
    addNode: AddMNode | MNode[],
    parent?: MContainer | null,
    {
      doNotSelect = false,
      doNotSwitchPage = false,
      doNotPushHistory = false,
      historyDescription,
      historySource,
    }: DslOpOptions = {},
  ): Promise<MNode | MNode[]> {
    this.captureSelectionBeforeOp();

    const stage = this.get('stage');

    // 新增多个组件只存在于粘贴多个组件,粘贴的是一个完整的config,所以不再需要getPropsValue
    const addNodes = [];
    if (!Array.isArray(addNode)) {
      const { type, inputEvent, ...config } = addNode;

      if (!type) throw new Error('组件类型不能为空');

      addNodes.push({ ...toRaw(await propsService.getPropsValue(type, config)) });
    } else {
      addNodes.push(...addNode);
    }

    const newNodes = await Promise.all(
      addNodes.map((node) => {
        const root = this.get('root');
        if ((isPage(node) || isPageFragment(node)) && root) {
          return this.doAdd(node, root);
        }
        const parentNode = parent ?? getAddParent(node);
        if (!parentNode) throw new Error('未找到父元素');
        return this.doAdd(node, parentNode);
      }),
    );

    if (newNodes.length > 1) {
      // 多选时只要任一新增节点位于非当前页面，触发的 multiSelect 就会引起页面切换
      const wouldSwitchPage = newNodes.some((n) => this.isOnDifferentPage(n));
      if (!doNotSelect && !(doNotSwitchPage && wouldSwitchPage)) {
        const newNodeIds = newNodes.map((node) => node.id);
        // 触发选中样式
        stage?.multiSelect(newNodeIds);
        await this.multiSelect(newNodeIds);
      }
    } else {
      const wouldSwitchPage = this.isOnDifferentPage(newNodes[0]);
      const skipSelect = doNotSelect || (doNotSwitchPage && wouldSwitchPage);

      if (!skipSelect) {
        await this.select(newNodes[0]);
      }

      if (isPage(newNodes[0])) {
        this.state.pageLength += 1;
      } else if (isPageFragment(newNodes[0])) {
        this.state.pageFragmentLength += 1;
      } else if (!skipSelect) {
        // 新增页面，这个时候页面还有渲染出来，此时select会出错，在runtime-ready的时候回去select
        stage?.select(newNodes[0].id);
      }
    }

    if (!(isPage(newNodes[0]) || isPageFragment(newNodes[0]))) {
      const pageForOp = this.getNodeInfo(newNodes[0].id, false).page;
      if (!doNotPushHistory) {
        const parentId = (this.getParentById(newNodes[0].id, false) ?? this.get('root'))!.id;
        this.pushOpHistory('add', {
          diff: newNodes.map((n) => {
            const p = this.getParentById(n.id, false) as MContainer;
            const idx = p ? getNodeIndex(n.id, p) : -1;
            return {
              newSchema: cloneDeep(toRaw(n)),
              parentId,
              index: typeof idx === 'number' ? idx : -1,
            };
          }),
          pageData: { name: pageForOp?.name || '', id: pageForOp!.id },
          historyDescription,
          source: historySource,
        });
      } else {
        this.selectionBeforeOp = null;
      }
    }

    this.emit('add', newNodes);

    return Array.isArray(addNode) ? newNodes : newNodes[0];
  }

  public async doRemove(
    node: MNode,
    { doNotSelect = false, doNotSwitchPage = false }: DslOpOptions = {},
  ): Promise<void> {
    const root = this.get('root');
    if (!root) throw new Error('root不能为空');

    const { parent, node: curNode } = this.getNodeInfo(node.id, false);

    if (!parent || !curNode) throw new Error('找不要删除的节点');

    const index = getNodeIndex(curNode.id, parent);

    if (typeof index !== 'number' || index === -1) throw new Error('找不要删除的节点');

    parent.items?.splice(index, 1);
    const stage = this.get('stage');
    stage?.remove({ id: node.id, parentId: parent.id, root: cloneDeep(root) });

    // 始终清理已删除节点在 state 中的残留引用：
    // - 即使后续会调用 selectDefault / select(parent) 覆盖，跳过这些调用（doNotSelect / doNotSwitchPage）时也不能让 state 持有已删除节点
    const selectedNodes = this.get('nodes');
    const removedSelectedIndex = selectedNodes.findIndex((n: MNode) => `${n.id}` === `${node.id}`);
    if (removedSelectedIndex !== -1) {
      const nextSelected = [...selectedNodes];
      nextSelected.splice(removedSelectedIndex, 1);
      this.set('nodes', nextSelected);
    }
    if (isPage(node) || isPageFragment(node)) {
      const currentPage = this.get('page');
      if (currentPage && `${currentPage.id}` === `${node.id}`) {
        this.set('page', null);
      }
    }

    const selectDefault = async (pages: MNode[]) => {
      if (pages[0]) {
        await this.select(pages[0]);
        stage?.select(pages[0].id);
      } else {
        this.selectRoot();

        historyService.resetPage();
      }
    };

    const rootItems = root.items || [];

    if (isPage(node)) {
      this.state.pageLength -= 1;

      // 删除页面后默认会切到首个剩余页面（selectDefault），doNotSwitchPage 时跳过这次自动切换
      if (!doNotSelect && !doNotSwitchPage) {
        await selectDefault(rootItems);
      }
    } else if (isPageFragment(node)) {
      this.state.pageFragmentLength -= 1;

      if (!doNotSelect && !doNotSwitchPage) {
        await selectDefault(rootItems);
      }
    } else {
      if (!doNotSelect) {
        await this.select(parent);
        stage?.select(parent.id);
      }

      this.addModifiedNodeId(parent.id);
    }

    if (!rootItems.length) {
      this.resetModifiedNodeId();
      historyService.reset();
    }
  }

  /**
   * 删除组件
   * @param {Object} node 要删除的节点或节点集合
   * @param options 可选配置
   * @param options.doNotSelect 删除后是否不更新当前选中节点（默认 false，删除后会选中父节点或首个页面）
   * @param options.doNotSwitchPage 删除后是否不切换当前页面（默认 false；删除页面 / 页面片段时为 true 会跳过自动切换到首个剩余页面）
   * @param options.doNotPushHistory 是否不写入历史记录（默认 false）
   */
  public async remove(
    nodeOrNodeList: MNode | MNode[],
    {
      doNotSelect = false,
      doNotSwitchPage = false,
      doNotPushHistory = false,
      historyDescription,
      historySource,
    }: DslOpOptions = {},
  ): Promise<void> {
    this.captureSelectionBeforeOp();

    const nodes = Array.isArray(nodeOrNodeList) ? nodeOrNodeList : [nodeOrNodeList];

    const removedItems: StepDiffItem<MNode>[] = [];
    let pageForOp: { name: string; id: Id } | null = null;
    if (!(isPage(nodes[0]) || isPageFragment(nodes[0]))) {
      for (const n of nodes) {
        const { parent, node: curNode, page } = this.getNodeInfo(n.id, false);
        if (parent && curNode) {
          if (!pageForOp && page) {
            pageForOp = { name: page.name || '', id: page.id };
          }
          const idx = getNodeIndex(curNode.id, parent);
          removedItems.push({
            oldSchema: cloneDeep(toRaw(curNode)),
            parentId: parent.id,
            index: typeof idx === 'number' ? idx : -1,
          });
        }
      }
    }

    await Promise.all(nodes.map((node) => this.doRemove(node, { doNotSelect, doNotSwitchPage })));

    if (removedItems.length > 0 && pageForOp) {
      if (!doNotPushHistory) {
        this.pushOpHistory('remove', {
          diff: removedItems,
          pageData: pageForOp,
          historyDescription,
          source: historySource,
        });
      } else {
        this.selectionBeforeOp = null;
      }
    }

    this.emit('remove', nodes);
  }

  public async doUpdate(
    config: MNode,
    { changeRecords = [] }: { changeRecords?: ChangeRecord[] } = {},
  ): Promise<{ newNode: MNode; oldNode: MNode; changeRecords?: ChangeRecord[] }> {
    const root = this.get('root');
    if (!root) throw new Error('root为空');

    if (!config?.id) throw new Error('没有配置或者配置缺少id值');

    const info = this.getNodeInfo(config.id, false);

    if (!info.node) throw new Error(`获取不到id为${config.id}的节点`);

    const node = toRaw(info.node);

    let newConfig = await toggleFixedPosition(toRaw(config), node, root, this.getLayout);

    newConfig = mergeWith(cloneDeep(node), newConfig, editorNodeMergeCustomizer);

    if (!newConfig.type) throw new Error('配置缺少type值');

    if (newConfig.type === NodeType.ROOT) {
      this.set('root', newConfig as MApp);
      return {
        oldNode: node,
        newNode: newConfig,
        changeRecords,
      };
    }

    const { parent } = info;
    if (!parent) throw new Error('获取不到父级节点');

    const parentNodeItems = parent.items;
    const index = getNodeIndex(newConfig.id, parent);

    if (!parentNodeItems || typeof index === 'undefined' || index === -1) throw new Error('更新的节点未找到');

    const newLayout = await this.getLayout(newConfig);
    const layout = await this.getLayout(node);
    if (Array.isArray(newConfig.items) && newLayout !== layout) {
      newConfig = setChildrenLayout(newConfig as MContainer, newLayout);
    }

    parentNodeItems[index] = newConfig;

    // 当被更新节点正好在当前选中列表中时，必须同步引用，否则 state 会持有已被替换的旧节点
    const selectedNodes = this.get('nodes');
    const targetIndex = selectedNodes.findIndex((nodeItem: MNode) => `${nodeItem.id}` === `${newConfig.id}`);
    if (targetIndex !== -1) {
      selectedNodes.splice(targetIndex, 1, newConfig);
      this.set('nodes', [...selectedNodes]);
    }

    // 只有被更新节点正好是当前选中页面时才同步 state.page，避免「更新非当前页」误将编辑器切到该页
    if (isPage(newConfig) || isPageFragment(newConfig)) {
      const currentPage = this.get('page');
      if (currentPage && `${currentPage.id}` === `${newConfig.id}`) {
        this.set('page', newConfig as MPage | MPageFragment);
      }
    }

    this.addModifiedNodeId(newConfig.id);

    return {
      oldNode: node,
      newNode: newConfig,
      changeRecords,
    };
  }

  /**
   * 更新节点
   * update后会触发依赖收集，收集完后会掉stage.update方法
   * @param config 新的节点配置，配置中需要有id信息
   * @param data 额外数据
   * @param data.changeRecords 单节点 form 端变更记录（多节点场景下被忽略，使用 changeRecordList）
   * @param data.changeRecordList 多节点 form 端变更记录列表，按 config 数组同序对应每个节点；优先级高于 changeRecords
   * @param data.doNotPushHistory 是否不写入历史记录（默认 false）
   * @param data.historyDescription 入栈时附带的人类可读描述，用于历史面板展示（不影响 undo/redo 行为）
   * @returns 更新后的节点配置
   */
  public async update(
    config: MNode | MNode[],
    data: {
      changeRecords?: ChangeRecord[];
      changeRecordList?: ChangeRecord[][];
      doNotPushHistory?: boolean;
      historyDescription?: string;
      historySource?: HistoryOpSource;
    } = {},
  ): Promise<MNode | MNode[]> {
    this.captureSelectionBeforeOp();

    const { doNotPushHistory = false, changeRecordList, changeRecords, historyDescription, historySource } = data;

    const nodes = Array.isArray(config) ? config : [config];

    // 多节点必须使用 changeRecordList 为每个节点提供独立的记录；
    // 否则同一份 changeRecords 会被复用到每个节点上，nodeUpdateHandler / 历史回放都会按错误的 propPath 处理。
    const updateData = await Promise.all(
      nodes.map((node, index) => {
        const recordsForNode = changeRecordList ? (changeRecordList[index] ?? []) : (changeRecords ?? []);
        return this.doUpdate(node, { changeRecords: recordsForNode });
      }),
    );

    if (updateData[0].oldNode?.type !== NodeType.ROOT) {
      const curNodes = this.get('nodes');
      if (curNodes.length) {
        if (!doNotPushHistory) {
          const pageForOp = this.getNodeInfo(nodes[0].id, false).page;
          this.pushOpHistory('update', {
            // 每个节点单独保留自己的 changeRecords，便于撤销/重做时按 propPath 精细化更新；
            // 没有 changeRecords 的（如内部 sort/moveLayer 等整节点替换操作）会退化为全节点替换。
            diff: buildUpdateDiff(
              updateData.map((d) => ({
                oldNode: cloneDeep(d.oldNode),
                newNode: cloneDeep(d.newNode),
                changeRecords: d.changeRecords?.length ? cloneDeep(d.changeRecords) : undefined,
              })),
            ),
            pageData: { name: pageForOp?.name || '', id: pageForOp!.id },
            historyDescription,
            source: historySource,
          });
        } else {
          this.selectionBeforeOp = null;
        }
      }
    }

    this.emit('update', updateData);
    return Array.isArray(config) ? updateData.map((item) => item.newNode) : updateData[0].newNode;
  }

  /**
   * 将id为id1的组件移动到id为id2的组件位置上，例如：[1,2,3,4] -> sort(1,3) -> [2,1,3,4]
   * @param id1 组件ID
   * @param id2 组件ID
   * @param options 可选配置
   * @param options.doNotSelect 排序后是否不更新当前选中节点（默认 false）
   * @param options.doNotSwitchPage 排序后是否不切换当前页面（排序只发生在同一父节点内，方法内为空操作；保留以与其它 DSL 操作 API 一致）
   * @param options.doNotPushHistory 是否不写入历史记录（默认 false）
   * @returns void
   */
  public async sort(
    id1: Id,
    id2: Id,
    { doNotSelect = false, doNotPushHistory = false, historySource }: DslOpOptions = {},
  ): Promise<void> {
    this.captureSelectionBeforeOp();

    const root = this.get('root');
    if (!root) throw new Error('root为空');

    const node = this.get('node');
    if (!node) throw new Error('当前节点为空');

    const parent = cloneDeep(toRaw(this.get('parent')));
    if (!parent) throw new Error('父节点为空');

    const index2 = parent.items.findIndex((node: MNode) => `${node.id}` === `${id2}`);
    // 在 id1 的兄弟组件中若无 id2 则直接 return
    if (index2 < 0) return;
    const index1 = parent.items.findIndex((node: MNode) => `${node.id}` === `${id1}`);

    parent.items.splice(index2, 0, ...parent.items.splice(index1, 1));

    await this.update(parent, { doNotPushHistory, historySource });
    if (!doNotSelect) {
      await this.select(node);
    }

    this.get('stage')?.update({
      config: cloneDeep(node),
      parentId: parent.id,
      root: cloneDeep(root),
    });
  }

  /**
   * 将组件节点配置存储到localStorage中
   * @param config 组件节点配置
   * @returns
   */
  public copy(config: MNode | MNode[]): void {
    storageService.setItem(COPY_STORAGE_KEY, Array.isArray(config) ? config : [config], {
      protocol: Protocol.OBJECT,
    });
  }

  /**
   * 复制时会带上组件关联的依赖
   * @param config 组件节点配置
   * @returns
   */
  public copyWithRelated(config: MNode | MNode[], collectorOptions?: TargetOptions): void {
    const copyNodes: MNode[] = Array.isArray(config) ? config : [config];

    if (collectorOptions && typeof collectorOptions.isTarget === 'function') {
      collectRelatedNodes(copyNodes, collectorOptions, (id) => this.getNodeById(id));
    }

    storageService.setItem(COPY_STORAGE_KEY, copyNodes, {
      protocol: Protocol.OBJECT,
    });
  }

  /**
   * 从localStorage中获取节点，然后添加到当前容器中
   * @param position 粘贴的坐标
   * @param collectorOptions 可选的依赖收集器配置
   * @param options 可选配置
   * @param options.doNotSelect 粘贴后是否不更新当前选中节点（默认 false）
   * @param options.doNotSwitchPage 粘贴后是否不切换当前页面（默认 false；跨页粘贴时为 true 会跳过页面切换）
   * @param options.doNotPushHistory 是否不写入历史记录（默认 false）
   * @returns 添加后的组件节点配置
   */
  public async paste(
    position: PastePosition = {},
    collectorOptions?: TargetOptions,
    {
      doNotSelect = false,
      doNotSwitchPage = false,
      doNotPushHistory = false,
      historyDescription,
      historySource,
    }: DslOpOptions = {},
  ): Promise<MNode | MNode[] | void> {
    const config: MNode[] = storageService.getItem(COPY_STORAGE_KEY);
    if (!Array.isArray(config)) return;

    const node = this.get('node');

    let parent: MContainer | null = null;
    // 粘贴的组件为当前选中组件的副本时，则添加到当前选中组件的父组件中
    if (config.length === 1 && config[0].id === node?.id) {
      parent = this.get('parent');
      if (parent?.type === NodeType.ROOT) {
        parent = this.get('page');
      }
    }
    const pasteConfigs = await this.doPaste(config, position);

    if (collectorOptions && typeof collectorOptions.isTarget === 'function') {
      propsService.replaceRelateId(config, pasteConfigs, collectorOptions);
    }

    return this.add(pasteConfigs, parent, {
      doNotSelect,
      doNotSwitchPage,
      doNotPushHistory,
      historyDescription,
      historySource,
    });
  }

  public async doPaste(config: MNode[], position: PastePosition = {}): Promise<MNode[]> {
    propsService.clearRelateId();
    const doc = this.get('stage')?.renderer?.contentWindow?.document;
    const pasteConfigs = beforePaste(position, cloneDeep(config), doc);
    return pasteConfigs;
  }

  public async doAlignCenter(config: MNode): Promise<MNode> {
    const parent = this.getParentById(config.id);
    if (!parent) throw new Error('找不到父节点');

    const node = cloneDeep(toRaw(config));
    const layout = await this.getLayout(parent, node);
    const doc = this.get('stage')?.renderer?.contentWindow?.document;
    const newStyle = calcAlignCenterStyle(node, parent, layout, doc);

    if (!newStyle) return config;

    node.style = newStyle;
    return node;
  }

  /**
   * 将指点节点设置居中
   * @param config 组件节点配置
   * @param options 可选配置
   * @param options.doNotSelect 居中后是否不更新当前选中节点（默认 false）
   * @param options.doNotSwitchPage 居中后是否不切换当前页面（居中只更新节点 style，方法内为空操作；保留以与其它 DSL 操作 API 一致）
   * @param options.doNotPushHistory 是否不写入历史记录（默认 false）
   * @returns 当前组件节点配置
   */
  public async alignCenter(
    config: MNode | MNode[],
    { doNotSelect = false, doNotPushHistory = false, historyDescription, historySource }: DslOpOptions = {},
  ): Promise<MNode | MNode[]> {
    const nodes = Array.isArray(config) ? config : [config];
    const stage = this.get('stage');

    const newNodes = await Promise.all(nodes.map((node) => this.doAlignCenter(node)));

    const newNode = await this.update(newNodes, { doNotPushHistory, historyDescription, historySource });

    if (!doNotSelect) {
      if (newNodes.length > 1) {
        await stage?.multiSelect(newNodes.map((node) => node.id));
      } else {
        await stage?.select(newNodes[0].id);
      }
    }

    return newNode;
  }

  /**
   * 移动当前选中节点位置
   * @param offset 偏移量
   * @param options 可选配置
   * @param options.doNotPushHistory 是否不写入历史记录（默认 false）
   */
  public async moveLayer(
    offset: number | LayerOffset,
    { doNotPushHistory = false, historyDescription, historySource }: DslOpOptions = {},
  ): Promise<void> {
    this.captureSelectionBeforeOp();

    const root = this.get('root');
    if (!root) throw new Error('root为空');

    const parent = this.get('parent');
    if (!parent) throw new Error('父节点为空');

    const node = this.get('node');
    if (!node) throw new Error('当前节点为空');

    const brothers: MNode[] = parent.items || [];
    const index = brothers.findIndex((item) => `${item.id}` === `${node?.id}`);

    const layout = await this.getLayout(parent, node);
    const isRelative = layout === Layout.RELATIVE;
    const offsetIndex = calcLayerTargetIndex(index, offset, brothers.length, isRelative);

    if ((offsetIndex > 0 && offsetIndex > brothers.length) || offsetIndex < 0) {
      return;
    }

    const oldParent = cloneDeep(toRaw(parent));

    brothers.splice(index, 1);
    brothers.splice(offsetIndex, 0, node);

    const grandparent = this.getParentById(parent.id);

    this.get('stage')?.update({
      config: cloneDeep(toRaw(parent)),
      parentId: grandparent?.id,
      root: cloneDeep(root),
    });

    this.addModifiedNodeId(parent.id);
    if (!doNotPushHistory) {
      const pageForOp = this.getNodeInfo(node.id, false).page;
      this.pushOpHistory(
        'update',

        {
          diff: buildUpdateDiff([{ oldNode: oldParent, newNode: cloneDeep(toRaw(parent)) }]),
          pageData: { name: pageForOp?.name || '', id: pageForOp!.id },
          historyDescription,
          source: historySource,
        },
      );
    } else {
      this.selectionBeforeOp = null;
    }

    this.emit('move-layer', offset);
  }

  /**
   * 移动一个或多个节点到指定容器中。
   *
   * 多选场景（config 是数组）只会产生一条历史记录，
   * `updatedItems` 涵盖所有源父容器 + 目标容器的前后快照。
   * 这避免了"多选移动到某容器"在历史栈里被切成 N 条记录。
   *
   * @param config 需要移动的节点（或节点数组，各项需带 id；style 等字段会与原节点合并）
   * @param targetId 容器ID
   * @param options 可选配置
   * @param options.doNotSelect 移动后是否不更新当前选中节点（默认 false）
   * @param options.doNotSwitchPage 移动后是否不切换当前页面（默认 false；目标容器位于其它页面时为 true 会跳过自动选中以避免页面切换）
   * @param options.doNotPushHistory 是否不写入历史记录（默认 false）
   */
  public async moveToContainer(
    config: MNode | MNode[],
    targetId: Id,
    {
      doNotSelect = false,
      doNotSwitchPage = false,
      doNotPushHistory = false,
      historyDescription,
      historySource,
    }: DslOpOptions = {},
  ): Promise<MNode | MNode[]> {
    const isBatch = Array.isArray(config);
    const configs = (isBatch ? config : [config]).filter((item) => !(isPage(item) || isPageFragment(item)));

    if (configs.length === 0) {
      throw new Error('没有可移动的节点');
    }

    this.captureSelectionBeforeOp();

    const target = this.getNodeById(targetId, false) as MContainer;

    if (!target) {
      throw new Error('目标容器不存在');
    }

    const root = this.get('root');
    const stage = this.get('stage');

    if (!root || !stage) {
      throw new Error('root 或 stage为空');
    }

    // 收集 (节点, 源父) 信息，过滤掉异常节点（找不到父或源父等于目标本身）
    const moves: MoveItem[] = [];
    for (const { id } of configs) {
      const { node, parent, page } = this.getNodeInfo(id, false);
      if (!node || !parent) continue;
      moves.push({ node, parent, pageForOp: page ? { name: page.name || '', id: page.id } : null });
    }

    if (moves.length === 0) {
      throw new Error('没有可移动的节点');
    }

    // 记录所有涉及的源父容器（按 id 去重）+ 目标容器的前置快照；同一父容器只快照一次。
    const beforeSnapshots = new Map<Id, MNode>();
    beforeSnapshots.set(target.id, cloneDeep(toRaw(target)));
    for (const { parent } of moves) {
      if (!beforeSnapshots.has(parent.id)) {
        beforeSnapshots.set(parent.id, cloneDeep(toRaw(parent)));
      }
    }

    let newConfigs: MNode[] = [];

    const moveNodes = moves.map(({ node }) => node);
    await this.remove(moveNodes, { doNotPushHistory: true, doNotSelect, doNotSwitchPage: true });

    newConfigs = (await this.add(moveNodes, target, {
      doNotPushHistory: true,
      doNotSelect,
      doNotSwitchPage,
    })) as MNode[];

    if (!doNotPushHistory) {
      // 整批只入栈一条历史：updatedItems 包含所有源父容器 + 目标容器的前后快照（撤销/重做最小依赖）。
      const updatedItems = Array.from(beforeSnapshots.entries()).map(([id, oldNode]) => ({
        oldNode,
        newNode: cloneDeep(toRaw(this.getNodeById(id, false))) as MNode,
      }));
      const historyPage = moves[0].pageForOp ?? { name: '', id: target.id };
      this.pushOpHistory('update', {
        diff: buildUpdateDiff(updatedItems),
        pageData: historyPage,
        historyDescription,
        source: historySource,
      });
    } else {
      this.selectionBeforeOp = null;
    }

    return isBatch ? newConfigs : newConfigs[0];
  }

  public async dragTo(
    config: MNode | MNode[],
    targetParent: MContainer,
    targetIndex: number,
    { doNotPushHistory = false, historyDescription, historySource }: DslOpOptions = {},
  ) {
    this.captureSelectionBeforeOp();

    if (!targetParent || !Array.isArray(targetParent.items)) return;

    const configs = Array.isArray(config) ? config : [config];

    const beforeSnapshots = new Map<string, MNode>();
    for (const cfg of configs) {
      const { parent } = this.getNodeInfo(cfg.id, false);
      if (parent && !beforeSnapshots.has(`${parent.id}`)) {
        beforeSnapshots.set(`${parent.id}`, cloneDeep(toRaw(parent)));
      }
    }
    if (!beforeSnapshots.has(`${targetParent.id}`)) {
      beforeSnapshots.set(`${targetParent.id}`, cloneDeep(toRaw(targetParent)));
    }

    const newLayout = await this.getLayout(targetParent);
    const { sameParentIndices, crossParentConfigs, aborted } = classifyDragSources(configs, targetParent, (id, raw) =>
      this.getNodeInfo(id, raw),
    );
    if (aborted) return;

    for (const { config: crossConfig, parent } of crossParentConfigs) {
      const layout = await this.getLayout(parent);
      if (newLayout !== layout) {
        setLayout(crossConfig, newLayout);
      }
      const index = getNodeIndex(crossConfig.id, parent);
      parent.items?.splice(index, 1);
      this.addModifiedNodeId(parent.id);
    }

    moveItemsInContainer(sameParentIndices, targetParent, targetIndex);

    crossParentConfigs.forEach(({ config: crossConfig }, index) => {
      targetParent.items?.splice(targetIndex + index, 0, crossConfig);
      this.addModifiedNodeId(crossConfig.id);
    });

    const page = this.get('page');
    const root = this.get('root');
    const stage = this.get('stage');

    if (stage && page && root) {
      stage.update({
        config: cloneDeep(page),
        parentId: root.id,
        root: cloneDeep(root),
      });
    }

    const updatedItems: { oldNode: MNode; newNode: MNode }[] = [];
    for (const oldNode of beforeSnapshots.values()) {
      const newNode = this.getNodeById(oldNode.id, false);
      if (newNode) {
        updatedItems.push({ oldNode, newNode: cloneDeep(toRaw(newNode)) });
      }
    }
    if (!doNotPushHistory) {
      const pageForOp = this.getNodeInfo(configs[0].id, false).page;
      this.pushOpHistory('update', {
        diff: buildUpdateDiff(updatedItems),
        pageData: { name: pageForOp?.name || '', id: pageForOp!.id },
        historyDescription,
        source: historySource,
      });
    } else {
      this.selectionBeforeOp = null;
    }

    this.emit('drag-to', { targetIndex, configs, targetParent });
  }

  // #region AndGetHistoryId
  /**
   * 下列 *AndGetHistoryId 方法与对应的普通操作（add / remove / update ...）行为完全一致，
   * 唯一区别是返回值为本次写入历史栈的历史记录 uuid（{@link StepValue.uuid}），
   * 而非节点 / 节点数组。可用于精确引用 / 定位该条历史记录（埋点、revert、跨端同步等）。
   *
   * 当本次操作未写入历史（doNotPushHistory 为 true、或操作无实际变更 / 提前返回）时返回 null。
   */

  /** 等价于 {@link add}，但返回本次写入历史记录的 uuid（未入栈时返回 null）。 */
  public async addAndGetHistoryId(
    addNode: AddMNode | MNode[],
    parent?: MContainer | null,
    options: DslOpOptions = {},
  ): Promise<string | null> {
    this.lastPushedHistoryId = null;
    await this.add(addNode, parent, options);
    return this.lastPushedHistoryId;
  }

  /** 等价于 {@link remove}，但返回本次写入历史记录的 uuid（未入栈时返回 null）。 */
  public async removeAndGetHistoryId(
    nodeOrNodeList: MNode | MNode[],
    options: DslOpOptions = {},
  ): Promise<string | null> {
    this.lastPushedHistoryId = null;
    await this.remove(nodeOrNodeList, options);
    return this.lastPushedHistoryId;
  }

  /** 等价于 {@link update}，但返回本次写入历史记录的 uuid（未入栈时返回 null）。 */
  public async updateAndGetHistoryId(
    config: MNode | MNode[],
    data: {
      changeRecords?: ChangeRecord[];
      changeRecordList?: ChangeRecord[][];
      doNotPushHistory?: boolean;
      historyDescription?: string;
      historySource?: HistoryOpSource;
    } = {},
  ): Promise<string | null> {
    this.lastPushedHistoryId = null;
    await this.update(config, data);
    return this.lastPushedHistoryId;
  }

  /** 等价于 {@link moveLayer}，但返回本次写入历史记录的 uuid（未入栈时返回 null）。 */
  public async moveLayerAndGetHistoryId(
    offset: number | LayerOffset,
    options: DslOpOptions = {},
  ): Promise<string | null> {
    this.lastPushedHistoryId = null;
    await this.moveLayer(offset, options);
    return this.lastPushedHistoryId;
  }

  /** 等价于 {@link moveToContainer}，但返回本次写入历史记录的 uuid（未入栈时返回 null）。 */
  public async moveToContainerAndGetHistoryId(
    config: MNode | MNode[],
    targetId: Id,
    options: DslOpOptions = {},
  ): Promise<string | null> {
    this.lastPushedHistoryId = null;
    await this.moveToContainer(config, targetId, options);
    return this.lastPushedHistoryId;
  }

  /** 等价于 {@link dragTo}，但返回本次写入历史记录的 uuid（未入栈时返回 null）。 */
  public async dragToAndGetHistoryId(
    config: MNode | MNode[],
    targetParent: MContainer,
    targetIndex: number,
    options: DslOpOptions = {},
  ): Promise<string | null> {
    this.lastPushedHistoryId = null;
    await this.dragTo(config, targetParent, targetIndex, options);
    return this.lastPushedHistoryId;
  }
  // #endregion AndGetHistoryId

  /**
   * 撤销当前操作
   * @returns 被撤销的操作
   */
  public async undo(): Promise<StepValue | null> {
    const value = historyService.undo();
    if (value) {
      await this.applyHistoryOp(value, true);
    }
    return value;
  }

  /**
   * 恢复到下一步
   * @returns 被恢复的操作
   */
  public async redo(): Promise<StepValue | null> {
    const value = historyService.redo();
    if (value) {
      await this.applyHistoryOp(value, false);
    }
    return value;
  }

  /**
   * 「回滚」指定页面历史步骤（类 git revert 语义）：
   * - 不动原始历史栈结构（不移动 cursor、不丢弃任何步骤）；
   * - 取出 `index` 对应的 step，**反向应用**一次（add→remove / remove→add / update→旧值）；
   * - 把这次反向应用作为一条**新步骤**追加到栈顶，可被普通 undo / redo。
   *
   * 与 `gotoPageStep`（类 git reset）的区别在于此操作**不丢弃**目标之后的历史。
   * 与 `applyHistoryOp(reverse=true)` 的区别在于：本方法**不带** `doNotPushHistory`，
   * 反向应用会以一条新 step 入栈；并且不实施 step 中保存的选区与 modifiedNodeIds 状态，
   * 选区由用户当前位置决定，符合"新提交"语义。
   *
   * 仅对处于「已应用」状态的步骤生效——未应用的步骤本身就不存在于当前 DSL 中，反向无意义。
   *
   * @param index 目标 step 在所属页面栈中的索引（0 为最早），通常由历史面板传入
   * @returns 反向后产生的新 step；目标不存在 / 未应用 / 反向失败时返回 null
   */
  public async revertPageStep(index: number): Promise<StepValue | null> {
    const list = historyService.getPageStepList();
    const entry = list[index];
    if (!entry?.applied) return null;

    const { step } = entry;
    const root = this.get('root');
    if (!root) return null;

    // 更新类步骤必须带 changeRecords 才支持回滚：缺失时只能整节点替换，会冲掉后续无关变更，故不支持。
    if (step.opType === 'update') {
      const items = step.diff ?? [];
      if (!items.length || !items.every((item) => item.changeRecords?.length)) return null;
    }

    // 反向应用产生的新 step 由内部 pushOpHistory 触发 history `change` 事件，监听一次以拿到引用。
    let revertedStep: StepValue | null = null;
    const captureRevert = (s: StepValue) => {
      revertedStep = s;
    };
    historyService.once('change', captureRevert);

    const historyDescription = `回滚 #${index + 1}: ${describeStepForRevert(step)}`;
    // revert 走 public add/remove/update，让操作以一条普通新 step 入栈；不要切换选区与页面，避免打断用户。
    const opts = { doNotSelect: true, doNotSwitchPage: true, historyDescription, historySource: 'rollback' } as const;

    try {
      switch (step.opType) {
        case 'add': {
          // 原本是新增 → revert 即删除当时被加入的节点
          for (const { newSchema } of step.diff ?? []) {
            if (!newSchema) continue;
            const existing = this.getNodeById(newSchema.id, false);
            if (existing) {
              await this.remove(existing, opts);
            }
          }
          break;
        }
        case 'remove': {
          // 原本是删除 → revert 即把节点按原父容器加回来。
          // 按原 index 升序逐个插回，先小后大避免索引漂移。
          const items = step.diff ?? [];
          const sorted = [...items].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
          for (const { oldSchema, parentId } of sorted) {
            if (!oldSchema || parentId === undefined) continue;
            const parent = this.getNodeById(parentId, false) as MContainer | null;
            if (parent) {
              await this.add([cloneDeep(oldSchema)] as MNode[], parent, opts);
            }
          }
          break;
        }
        case 'update': {
          // 原本是更新 → revert 即把 oldSchema 的值写回；
          // 优先按 changeRecords 局部 patch（仅触达 propPath 下的字段，避免冲掉同节点上其它无关变更）。
          const items = step.diff ?? [];
          const configs = items
            .filter((item) => item.oldSchema && item.newSchema)
            .map(({ oldSchema, newSchema, changeRecords }) => {
              const oldNode = oldSchema!;
              const newNode = newSchema!;
              if (changeRecords?.length) {
                const patch: MNode = { id: newNode.id, type: newNode.type };
                for (const record of changeRecords) {
                  if (!record.propPath) {
                    // 没有 propPath 视为整节点替换
                    return cloneDeep(oldNode);
                  }
                  const value = cloneDeep(getValueByKeyPath(record.propPath, oldNode));
                  setValueByKeyPath(record.propPath, value, patch);
                }
                return patch;
              }
              return cloneDeep(oldNode);
            });
          if (configs.length) {
            await this.update(configs, { historyDescription, historySource: 'rollback' });
          }
          break;
        }
      }
    } finally {
      historyService.off('change', captureRevert);
    }

    // 通知一次 history-change，让上层（如属性面板）按当前最新 DSL 刷新
    const page = toRaw(this.get('page'));
    if (page) {
      this.emit('history-change', page as MPage | MPageFragment);
    }

    return revertedStep;
  }

  /**
   * 通过历史记录 uuid 回滚当前页面的某条历史步骤，语义与 {@link revertPageStep} 完全一致，
   * 仅入参从 index 改为 uuid（{@link StepValue.uuid}）。uuid 不随栈内步骤增删而变化，
   * 更适合业务侧持有引用后再回滚（埋点、跨端同步等场景）。
   *
   * @param uuid 目标历史记录的 uuid，通常由 *AndGetHistoryId 方法返回
   * @returns 反向后产生的新 step；找不到对应 uuid / 未应用 / 反向失败时返回 null
   */
  public async revertPageStepById(uuid: string): Promise<StepValue | null> {
    const index = historyService.getPageStepIndexByUuid(uuid);
    if (index < 0) return null;
    return this.revertPageStep(index);
  }

  /**
   * 跳转当前页面历史栈到指定游标位置。
   *
   * `targetCursor` 与 `UndoRedo.getCursor()` 同义：表示"已应用步骤数量"，
   * 取值范围 `[0, length]`。当目标 < 当前游标时循环 undo，否则循环 redo。
   * 通常由历史面板传入「点击的 step.index + 1」作为目标。
   *
   * @returns 实际移动到的最终游标位置
   */
  public async gotoPageStep(targetCursor: number): Promise<number> {
    let cursor = historyService.getPageCursor();
    const { length } = historyService.getPageStepList();
    const target = Math.max(0, Math.min(targetCursor, length));
    while (cursor > target) {
      const step = await this.undo();
      if (!step) break;
      cursor -= 1;
    }
    while (cursor < target) {
      const step = await this.redo();
      if (!step) break;
      cursor += 1;
    }
    return cursor;
  }

  public async move(
    left: number,
    top: number,
    { doNotPushHistory = false, historyDescription, historySource }: DslOpOptions = {},
  ) {
    const node = toRaw(this.get('node'));
    if (!node || isPage(node)) return;

    const newStyle = calcMoveStyle(node.style || {}, left, top);
    if (!newStyle) return;

    await this.update(
      { id: node.id, type: node.type, style: newStyle },
      { doNotPushHistory, historyDescription, historySource },
    );
  }

  public resetState() {
    this.set('root', null);
    this.set('node', null);
    this.set('nodes', []);
    this.set('page', null);
    this.set('parent', null);
    this.set('stage', null);
    this.set('highlightNode', null);
    this.set('modifiedNodeIds', new Map());
    this.set('pageLength', 0);
  }

  public destroy() {
    this.removeAllListeners();
    this.resetState();
    this.removeAllPlugins();
  }

  public resetModifiedNodeId() {
    this.get('modifiedNodeIds').clear();
  }

  public usePlugin(options: AsyncHookPlugin<AsyncMethodName, Editor>): void {
    super.usePlugin(options);
  }

  public on<Name extends keyof EditorEvents, Param extends EditorEvents[Name]>(
    eventName: Name,
    listener: (...args: Param) => void | Promise<void>,
  ) {
    return super.on(eventName, listener as any);
  }

  public once<Name extends keyof EditorEvents, Param extends EditorEvents[Name]>(
    eventName: Name,
    listener: (...args: Param) => void | Promise<void>,
  ) {
    return super.once(eventName, listener as any);
  }

  public emit<Name extends keyof EditorEvents, Param extends EditorEvents[Name]>(eventName: Name, ...args: Param) {
    return super.emit(eventName, ...args);
  }

  private addModifiedNodeId(id: Id) {
    this.get('modifiedNodeIds').set(id, id);
  }

  private captureSelectionBeforeOp() {
    if (this.selectionBeforeOp) return;
    this.selectionBeforeOp = this.get('nodes').map((n) => n.id);
  }

  private pushOpHistory(
    opType: HistoryOpType,
    {
      diff,
      pageData,
      historyDescription,
      source,
    }: {
      diff: StepDiffItem<MNode>[];
      pageData: { name: string; id: Id };
      historyDescription?: string;
      source?: HistoryOpSource;
    },
  ): string | null {
    const step: StepValue = {
      uuid: guid(),
      data: pageData,
      opType,
      selectedBefore: this.selectionBeforeOp ?? [],
      selectedAfter: this.get('nodes').map((n) => n.id),
      modifiedNodeIds: new Map(this.get('modifiedNodeIds')),
      diff,
    };
    if (historyDescription) step.historyDescription = historyDescription;
    if (source) step.source = source;
    // 显式按 step.data.id 入栈：跨页操作（如 moveToContainer 从源页搬到目标页）
    // 必须落到正确的页面栈，否则会把记录错误地推到当前活动页 / 操作发起页。
    const pushed = historyService.push(step, pageData.id);
    // push 返回 null 表示当前没有可写入的页面栈（未真正入栈），此时不应返回 uuid。
    const historyId = pushed ? step.uuid : null;
    this.lastPushedHistoryId = historyId;
    this.selectionBeforeOp = null;
    return historyId;
  }

  /**
   * 应用历史操作（撤销 / 重做）
   *
   * 所有 DSL 修改都走 `editor.add / remove / update`，并通过 `doNotPushHistory` 阻止再次入栈、
   * `doNotSelect / doNotSwitchPage` 让选区由方法末尾的统一逻辑兜底。
   *
   * 注意：这些公开方法会发出 add / remove / update 事件，业务侧若需要区分"用户操作"与"撤销重做触发"，
   * 请监听 `history-change` 事件配合判断。
   *
   * @param step 操作记录
   * @param reverse true = 撤销，false = 重做
   */
  private async applyHistoryOp(step: StepValue, reverse: boolean) {
    const root = this.get('root');
    const stage = this.get('stage');
    if (!root) return;

    const commonOpts = { doNotSelect: true, doNotSwitchPage: true, doNotPushHistory: true } as const;

    switch (step.opType) {
      case 'add': {
        const items = step.diff ?? [];
        if (reverse) {
          // 撤销 add：把当时加入的节点删除
          for (const { newSchema } of items) {
            if (!newSchema) continue;
            const existing = this.getNodeById(newSchema.id, false);
            if (existing) {
              await this.remove(existing, commonOpts);
            }
          }
        } else {
          // 重做 add：按记录的 parentId / index 把节点重新插回父容器。
          // 按目标 index 升序逐个插入，先小后大避免索引漂移
          const sorted = [...items].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
          for (const { newSchema, parentId, index } of sorted) {
            if (!newSchema || parentId === undefined) continue;
            const parent = this.getNodeById(parentId, false) as MContainer | null;
            if (parent?.items) {
              if (typeof index === 'number' && index >= 0 && index < parent.items.length) {
                parent.items.splice(index, 0, cloneDeep(newSchema));
              } else {
                parent.items.push(cloneDeep(newSchema));
              }
              await stage?.add({
                config: cloneDeep(newSchema),
                parent: cloneDeep(parent),
                parentId: parent.id,
                root: cloneDeep(root),
              });
            }
          }
        }
        break;
      }
      case 'remove': {
        const items = step.diff ?? [];
        if (reverse) {
          // 撤销 remove：按原 index 升序逐个插回（先小后大避免索引漂移）
          const sorted = [...items].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
          for (const { oldSchema, parentId, index } of sorted) {
            if (!oldSchema || parentId === undefined) continue;
            const parent = this.getNodeById(parentId, false) as MContainer | null;
            if (parent?.items) {
              parent.items.splice(index ?? parent.items.length, 0, cloneDeep(oldSchema));
              await stage?.add({
                config: cloneDeep(oldSchema),
                parent: cloneDeep(parent),
                parentId,
                root: cloneDeep(root),
              });
            }
          }
        } else {
          // 重做 remove：再删一次
          for (const { oldSchema } of items) {
            if (!oldSchema) continue;
            const existing = this.getNodeById(oldSchema.id, false);
            if (existing) {
              await this.remove(existing, commonOpts);
            }
          }
        }
        break;
      }
      case 'update': {
        const items = step.diff ?? [];
        // 优先按 changeRecords 局部 patch：仅触达 propPath 下的字段，避免整节点替换冲掉同节点上其它无关变更。
        // 没有 changeRecords 的（如内部 sort/moveLayer/拖动等整节点快照场景）才退化为整节点替换。
        const configs = items
          .filter((item) => item.oldSchema && item.newSchema)
          .map(({ oldSchema, newSchema, changeRecords }) => {
            const oldNode = oldSchema!;
            const newNode = newSchema!;
            if (changeRecords?.length) {
              const sourceForValues = reverse ? oldNode : newNode;
              // 仅保留 id / type 作为最小骨架，再按 propPath 写入需要回滚/重做的字段；
              // 后续 update -> mergeWith 会与现有节点深合并，patch 中未涉及的字段不会被改动。
              const patch: MNode = { id: newNode.id, type: newNode.type };
              for (const record of changeRecords) {
                if (!record.propPath) {
                  // 没有 propPath 视为整节点替换
                  return cloneDeep(sourceForValues);
                }
                const value = cloneDeep(getValueByKeyPath(record.propPath, sourceForValues));
                setValueByKeyPath(record.propPath, value, patch);
              }
              return patch;
            }
            return cloneDeep(reverse ? oldNode : newNode);
          });
        if (configs.length) {
          await this.update(configs, { doNotPushHistory: true });
        }
        break;
      }
    }

    this.set('modifiedNodeIds', step.modifiedNodeIds);

    const page = toRaw(this.get('page'));
    if (page) {
      const selectIds = reverse ? step.selectedBefore : step.selectedAfter;
      setTimeout(() => {
        if (!selectIds.length) return;

        if (selectIds.length > 1) {
          this.multiSelect(selectIds);
          stage?.multiSelect(selectIds);
        } else {
          this.select(selectIds[0])
            .then(() => stage?.select(selectIds[0]))
            .catch(() => {});
        }
      }, 0);
      this.emit('history-change', page as MPage | MPageFragment);
    }
  }

  private selectedConfigExceptionHandler(config: MNode | Id): EditorNodeInfo {
    return resolveSelectedNode(config, (id) => this.getNodeInfo(id), this.state.root?.id);
  }
}

export type EditorService = Editor;

export default new Editor();
