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
import { getNodeInfo, getNodePath, isPage, isPageFragment } from '@tmagic/utils';

import BaseService from '@editor/services//BaseService';
import propsService from '@editor/services//props';
import historyService from '@editor/services/history';
import storageService, { Protocol } from '@editor/services/storage';
import type {
  AddMNode,
  AsyncHookPlugin,
  AsyncMethodName,
  EditorEvents,
  EditorNodeInfo,
  HistoryOpType,
  PastePosition,
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
import type { HistoryOpContext } from '@editor/utils/editor-history';
import { applyHistoryAddOp, applyHistoryRemoveOp, applyHistoryUpdateOp } from '@editor/utils/editor-history';
import { beforePaste, getAddParent } from '@editor/utils/operator';

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
  });
  private isHistoryStateChange = false;
  private selectionBeforeOp: Id[] | null = null;

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

    return getNodeInfo(id, root);
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
   * 只有容器拥有布局
   */
  public async getLayout(parent: MNode, node?: MNode | null): Promise<Layout> {
    if (node && typeof node !== 'function' && isFixed(node.style || {})) return Layout.FIXED;

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
   * @returns 添加后的节点
   */
  public async add(addNode: AddMNode | MNode[], parent?: MContainer | null): Promise<MNode | MNode[]> {
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
        const parentNode = parent && typeof parent !== 'function' ? parent : getAddParent(node);
        if (!parentNode) throw new Error('未找到父元素');
        return this.doAdd(node, parentNode);
      }),
    );

    if (newNodes.length > 1) {
      const newNodeIds = newNodes.map((node) => node.id);
      // 触发选中样式
      stage?.multiSelect(newNodeIds);
      await this.multiSelect(newNodeIds);
    } else {
      await this.select(newNodes[0]);

      if (isPage(newNodes[0])) {
        this.state.pageLength += 1;
      } else if (isPageFragment(newNodes[0])) {
        this.state.pageFragmentLength += 1;
      } else {
        // 新增页面，这个时候页面还有渲染出来，此时select会出错，在runtime-ready的时候回去select
        stage?.select(newNodes[0].id);
      }
    }

    if (!(isPage(newNodes[0]) || isPageFragment(newNodes[0]))) {
      const pageForOp = this.getNodeInfo(newNodes[0].id, false).page;
      this.pushOpHistory(
        'add',
        {
          nodes: newNodes.map((n) => cloneDeep(toRaw(n))),
          parentId: (this.getParentById(newNodes[0].id, false) ?? this.get('root'))!.id,
          indexMap: Object.fromEntries(
            newNodes.map((n) => {
              const p = this.getParentById(n.id, false) as MContainer;
              return [n.id, p ? getNodeIndex(n.id, p) : -1];
            }),
          ),
        },
        { name: pageForOp?.name || '', id: pageForOp!.id },
      );
    }

    this.emit('add', newNodes);

    return Array.isArray(addNode) ? newNodes : newNodes[0];
  }

  public async doRemove(node: MNode): Promise<void> {
    const root = this.get('root');
    if (!root) throw new Error('root不能为空');

    const { parent, node: curNode } = this.getNodeInfo(node.id, false);

    if (!parent || !curNode) throw new Error('找不要删除的节点');

    const index = getNodeIndex(curNode.id, parent);

    if (typeof index !== 'number' || index === -1) throw new Error('找不要删除的节点');

    parent.items?.splice(index, 1);
    const stage = this.get('stage');
    stage?.remove({ id: node.id, parentId: parent.id, root: cloneDeep(root) });

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

      await selectDefault(rootItems);
    } else if (isPageFragment(node)) {
      this.state.pageFragmentLength -= 1;

      await selectDefault(rootItems);
    } else {
      await this.select(parent);
      stage?.select(parent.id);

      this.addModifiedNodeId(parent.id);
    }

    if (!rootItems.length) {
      this.resetModifiedNodeId();
      historyService.reset();
    }
  }

  /**
   * 删除组件
   * @param {Object} node
   */
  public async remove(nodeOrNodeList: MNode | MNode[]): Promise<void> {
    this.captureSelectionBeforeOp();

    const nodes = Array.isArray(nodeOrNodeList) ? nodeOrNodeList : [nodeOrNodeList];

    const removedItems: { node: MNode; parentId: Id; index: number }[] = [];
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
            node: cloneDeep(toRaw(curNode)),
            parentId: parent.id,
            index: typeof idx === 'number' ? idx : -1,
          });
        }
      }
    }

    await Promise.all(nodes.map((node) => this.doRemove(node)));

    if (removedItems.length > 0 && pageForOp) {
      this.pushOpHistory('remove', { removedItems }, pageForOp);
    }

    this.emit('remove', nodes);
  }

  public async doUpdate(
    config: MNode,
    {
      changeRecords = [],
      selectedAfterUpdate = true,
    }: { changeRecords?: ChangeRecord[]; selectedAfterUpdate?: boolean } = {},
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

    // 将update后的配置更新到nodes中
    if (selectedAfterUpdate) {
      const nodes = this.get('nodes');
      const targetIndex = nodes.findIndex((nodeItem: MNode) => `${nodeItem.id}` === `${newConfig.id}`);
      nodes.splice(targetIndex, 1, newConfig);
      this.set('nodes', [...nodes]);
    }

    if (isPage(newConfig) || isPageFragment(newConfig)) {
      this.set('page', newConfig as MPage | MPageFragment);
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
   * @returns 更新后的节点配置
   */
  public async update(
    config: MNode | MNode[],
    data: { changeRecords?: ChangeRecord[]; selectedAfterUpdate?: boolean } = {},
  ): Promise<MNode | MNode[]> {
    this.captureSelectionBeforeOp();

    const nodes = Array.isArray(config) ? config : [config];

    const updateData = await Promise.all(nodes.map((node) => this.doUpdate(node, data)));

    if (updateData[0].oldNode?.type !== NodeType.ROOT) {
      const curNodes = this.get('nodes');
      if (!this.isHistoryStateChange && curNodes.length) {
        const pageForOp = this.getNodeInfo(nodes[0].id, false).page;
        this.pushOpHistory(
          'update',
          {
            updatedItems: updateData.map((d) => ({
              oldNode: cloneDeep(d.oldNode),
              newNode: cloneDeep(toRaw(d.newNode)),
            })),
          },
          { name: pageForOp?.name || '', id: pageForOp!.id },
        );
      }
      this.isHistoryStateChange = false;
    }

    this.emit('update', updateData);
    return Array.isArray(config) ? updateData.map((item) => item.newNode) : updateData[0].newNode;
  }

  /**
   * 将id为id1的组件移动到id为id2的组件位置上，例如：[1,2,3,4] -> sort(1,3) -> [2,1,3,4]
   * @param id1 组件ID
   * @param id2 组件ID
   * @returns void
   */
  public async sort(id1: Id, id2: Id): Promise<void> {
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

    await this.update(parent);
    await this.select(node);

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
   * @returns 添加后的组件节点配置
   */
  public async paste(position: PastePosition = {}, collectorOptions?: TargetOptions): Promise<MNode | MNode[] | void> {
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

    return this.add(pasteConfigs, parent);
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
   * @returns 当前组件节点配置
   */
  public async alignCenter(config: MNode | MNode[]): Promise<MNode | MNode[]> {
    const nodes = Array.isArray(config) ? config : [config];
    const stage = this.get('stage');

    const newNodes = await Promise.all(nodes.map((node) => this.doAlignCenter(node)));

    const newNode = await this.update(newNodes);

    if (newNodes.length > 1) {
      await stage?.multiSelect(newNodes.map((node) => node.id));
    } else {
      await stage?.select(newNodes[0].id);
    }

    return newNode;
  }

  /**
   * 移动当前选中节点位置
   * @param offset 偏移量
   */
  public async moveLayer(offset: number | LayerOffset): Promise<void> {
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
    const pageForOp = this.getNodeInfo(node.id, false).page;
    this.pushOpHistory(
      'update',
      {
        updatedItems: [{ oldNode: oldParent, newNode: cloneDeep(toRaw(parent)) }],
      },
      { name: pageForOp?.name || '', id: pageForOp!.id },
    );

    this.emit('move-layer', offset);
  }

  /**
   * 移动到指定容器中
   * @param config 需要移动的节点
   * @param targetId 容器ID
   */
  public async moveToContainer(config: MNode, targetId: Id): Promise<MNode | undefined> {
    this.captureSelectionBeforeOp();

    const root = this.get('root');
    const { node, parent, page: pageForOp } = this.getNodeInfo(config.id, false);
    const target = this.getNodeById(targetId, false) as MContainer;

    const stage = this.get('stage');
    if (root && node && parent && stage) {
      const oldSourceParent = cloneDeep(toRaw(parent));
      const oldTarget = cloneDeep(toRaw(target));

      const index = getNodeIndex(node.id, parent);
      parent.items?.splice(index, 1);

      await stage.remove({ id: node.id, parentId: parent.id, root: cloneDeep(root) });

      const layout = await this.getLayout(target);

      const newConfig = mergeWith(cloneDeep(node), config, (_objValue, srcValue) => {
        if (Array.isArray(srcValue)) {
          return srcValue;
        }
      });
      newConfig.style = getInitPositionStyle(newConfig.style, layout);

      target.items.push(newConfig);

      await stage.select(targetId);

      const targetParent = this.getParentById(target.id);
      await stage.update({
        config: cloneDeep(target),
        parentId: targetParent?.id,
        root: cloneDeep(root),
      });

      await this.select(newConfig);
      stage.select(newConfig.id);

      this.addModifiedNodeId(target.id);
      this.addModifiedNodeId(parent.id);
      this.pushOpHistory(
        'update',
        {
          updatedItems: [
            { oldNode: oldSourceParent, newNode: cloneDeep(toRaw(parent)) },
            { oldNode: oldTarget, newNode: cloneDeep(toRaw(target)) },
          ],
        },
        { name: pageForOp?.name || '', id: pageForOp!.id },
      );

      return newConfig;
    }
  }

  public async dragTo(config: MNode | MNode[], targetParent: MContainer, targetIndex: number) {
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
    const pageForOp = this.getNodeInfo(configs[0].id, false).page;
    this.pushOpHistory('update', { updatedItems }, { name: pageForOp?.name || '', id: pageForOp!.id });

    this.emit('drag-to', { targetIndex, configs, targetParent });
  }

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

  public async move(left: number, top: number) {
    const node = toRaw(this.get('node'));
    if (!node || isPage(node)) return;

    const newStyle = calcMoveStyle(node.style || {}, left, top);
    if (!newStyle) return;

    await this.update({ id: node.id, type: node.type, style: newStyle });
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
    if (!this.isHistoryStateChange) {
      this.get('modifiedNodeIds').set(id, id);
    }
  }

  private captureSelectionBeforeOp() {
    if (this.isHistoryStateChange || this.selectionBeforeOp) return;
    this.selectionBeforeOp = this.get('nodes').map((n) => n.id);
  }

  private pushOpHistory(opType: HistoryOpType, extra: Partial<StepValue>, pageData: { name: string; id: Id }) {
    if (this.isHistoryStateChange) {
      this.selectionBeforeOp = null;
      return;
    }

    const step: StepValue = {
      data: pageData,
      opType,
      selectedBefore: this.selectionBeforeOp ?? [],
      selectedAfter: this.get('nodes').map((n) => n.id),
      modifiedNodeIds: new Map(this.get('modifiedNodeIds')),
      ...extra,
    };
    historyService.push(step);
    this.selectionBeforeOp = null;
    this.isHistoryStateChange = false;
  }

  /**
   * 应用历史操作（撤销 / 重做）
   * @param step 操作记录
   * @param reverse true = 撤销，false = 重做
   */
  private async applyHistoryOp(step: StepValue, reverse: boolean) {
    this.isHistoryStateChange = true;

    const root = this.get('root');
    const stage = this.get('stage');
    if (!root) return;

    const ctx: HistoryOpContext = {
      root,
      stage,
      getNodeById: (id, raw) => this.getNodeById(id, raw),
      getNodeInfo: (id, raw) => this.getNodeInfo(id, raw),
      setRoot: (r) => this.set('root', r),
      setPage: (p) => this.set('page', p),
      getPage: () => this.get('page'),
    };

    switch (step.opType) {
      case 'add':
        await applyHistoryAddOp(step, reverse, ctx);
        break;
      case 'remove':
        await applyHistoryRemoveOp(step, reverse, ctx);
        break;
      case 'update':
        await applyHistoryUpdateOp(step, reverse, ctx);
        break;
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

    this.isHistoryStateChange = false;
  }

  private selectedConfigExceptionHandler(config: MNode | Id): EditorNodeInfo {
    return resolveSelectedNode(config, (id) => this.getNodeInfo(id), this.state.root?.id);
  }
}

export type EditorService = Editor;

export default new Editor();
