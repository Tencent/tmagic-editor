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

import { reactive, toRaw } from 'vue';
import { cloneDeep, mergeWith } from 'lodash-es';
import serialize from 'serialize-javascript';

import type { Id, MApp, MComponent, MContainer, MNode, MPage } from '@tmagic/schema';
import { NodeType } from '@tmagic/schema';
import StageCore from '@tmagic/stage';
import { getNodePath, isNumber, isPage, isPop } from '@tmagic/utils';

import historyService, { StepValue } from '@editor/services/history';
import propsService from '@editor/services/props';
import type { AddMNode, EditorNodeInfo, StoreState } from '@editor/type';
import { LayerOffset, Layout } from '@editor/type';
import {
  change2Fixed,
  COPY_STORAGE_KEY,
  Fixed2Other,
  fixNodeLeft,
  generatePageNameByApp,
  getInitPositionStyle,
  getNodeIndex,
  isFixed,
  setLayout,
} from '@editor/utils/editor';

import BaseService from './BaseService';

class Editor extends BaseService {
  private isHistoryStateChange = false;

  private state = reactive<StoreState>({
    root: null,
    page: null,
    parent: null,
    node: null,
    stage: null,
    highlightNode: null,
    modifiedNodeIds: new Map(),
    pageLength: 0,
  });

  constructor() {
    super(
      [
        'getLayout',
        'select',
        'add',
        'remove',
        'update',
        'sort',
        'copy',
        'paste',
        'alignCenter',
        'moveLayer',
        'moveToContainer',
        'move',
        'undo',
        'redo',
        'highlight',
      ],
      // ???????????????????????????????????????????????????????????????????????????????????????????????????
      ['select', 'update', 'moveLayer'],
    );
  }

  /**
   * ??????????????????????????????
   * @param name 'root' | 'page' | 'parent' | 'node' | 'highlightNode'
   * @param value MNode
   * @returns MNode
   */
  public set<T = MNode>(name: keyof StoreState, value: T) {
    this.state[name] = value as any;

    if (name === 'root') {
      this.state.pageLength = (value as unknown as MApp)?.items?.length || 0;
      this.emit('root-change', value);
    }
  }

  /**
   * ??????????????????????????????
   * @param name  'root' | 'page' | 'parent' | 'node'
   * @returns MNode
   */
  public get<T = MNode>(name: keyof StoreState): T {
    return (this.state as any)[name];
  }

  /**
   * ??????id??????????????????????????????????????????????????????????????????
   * @param {number | string} id ??????id
   * @param {boolean} raw ????????????toRaw
   * @returns {EditorNodeInfo}
   */
  public getNodeInfo(id: Id, raw = true): EditorNodeInfo {
    let root = this.get<MApp | null>('root');
    if (raw) {
      root = toRaw(root);
    }
    if (!root) return {};

    if (id === root.id) {
      return { node: root };
    }

    const path = getNodePath(id, root.items);

    if (!path.length) return {};

    path.unshift(root);
    const info: EditorNodeInfo = {};

    info.node = path[path.length - 1] as MComponent;
    info.parent = path[path.length - 2] as MContainer;

    path.forEach((item) => {
      if (item.type === NodeType.PAGE) {
        info.page = item as MPage;
        return;
      }
    });

    return info;
  }

  /**
   * ??????ID????????????????????????
   * @param id ??????ID
   * @param {boolean} raw ????????????toRaw
   * @returns ??????????????????
   */
  public getNodeById(id: Id, raw = true): MNode | undefined {
    const { node } = this.getNodeInfo(id, raw);
    return node;
  }

  /**
   * ??????ID????????????????????????????????????
   * @param id ??????ID
   * @param {boolean} raw ????????????toRaw
   * @returns ??????????????????????????????
   */
  public getParentById(id: Id, raw = true): MContainer | undefined {
    if (!this.get<MApp | null>('root')) return;
    const { parent } = this.getNodeInfo(id, raw);
    return parent;
  }

  /**
   * ????????????????????????
   */
  public async getLayout(parent: MNode, node?: MNode): Promise<Layout> {
    if (node && typeof node !== 'function' && isFixed(node)) return Layout.FIXED;

    if (parent.layout) {
      return parent.layout;
    }

    // ???????????????????????????position??????????????????????????????????????????root????????????
    if (!parent.style?.position) {
      return Layout.RELATIVE;
    }

    return Layout.ABSOLUTE;
  }

  /**
   * ??????????????????????????????????????????????????????????????????
   * @param config ????????????????????????ID
   * @returns ???????????????????????????
   */
  public async select(config: MNode | Id): Promise<MNode> | never {
    const { node, page, parent } = this.selectedConfigExceptionHandler(config);
    this.set('node', node);
    this.set('page', page || null);
    this.set('parent', parent || null);

    if (page) {
      historyService.changePage(toRaw(page));
    } else {
      historyService.empty();
    }

    if (node?.id) {
      this.get<StageCore>('stage')
        ?.renderer.runtime?.getApp?.()
        ?.emit(
          'editor:select',
          {
            node,
            page,
            parent,
          },
          getNodePath(node.id, this.get<MApp>('root').items),
        );
    }

    this.emit('select', node);

    return node!;
  }

  public async selectNextNode(): Promise<MNode> | never {
    const node = toRaw(this.get('node'));

    if (!node || isPage(node) || node.type === NodeType.ROOT) return node;

    const parent = toRaw(this.getParentById(node.id));

    if (!parent) return node;

    const index = getNodeIndex(node, parent);

    const nextNode = parent.items[index + 1] || parent.items[0];

    await this.select(nextNode);
    this.get<StageCore>('stage')?.select(nextNode.id);

    return nextNode;
  }

  public async selectNextPage(): Promise<MNode> | never {
    const root = toRaw(this.get<MApp>('root'));
    const page = toRaw(this.get('page'));

    const index = getNodeIndex(page, root);

    const nextPage = root.items[index + 1] || root.items[0];

    await this.select(nextPage);
    this.get<StageCore>('stage')?.select(nextPage.id);

    return nextPage;
  }

  /**
   * ??????????????????
   * @param config ????????????????????????ID
   * @returns ???????????????????????????
   */
  public highlight(config: MNode | Id): void {
    const { node } = this.selectedConfigExceptionHandler(config);
    const currentHighlightNode = this.get('highlightNode');
    if (currentHighlightNode === node) return;
    this.set('highlightNode', node);
  }

  /**
   * ?????????????????????????????????
   * @param addConfig ?????????????????????????????????
   * @param parent ??????????????????????????????????????????????????????????????????????????????????????????????????????
   * @returns ??????????????????
   */
  public async add(addNode: AddMNode, parent?: MContainer | null): Promise<MNode> {
    // ??????inputEvent????????????????????????????????????????????????????????????????????????????????????????????????????????????
    const { type, inputEvent, ...config } = addNode;
    const curNode = this.get<MContainer>('node');

    let parentNode: MContainer | undefined;
    const isPage = type === NodeType.PAGE;

    if (isPage) {
      parentNode = this.get<MApp>('root');
      // ?????????????????????????????????parent?????????undefined??????parent?????????next??????
    } else if (parent && typeof parent !== 'function') {
      parentNode = parent;
    } else if (curNode.items) {
      parentNode = curNode;
    } else {
      parentNode = this.getParentById(curNode.id, false);
    }

    if (!parentNode) throw new Error('??????????????????');

    const layout = await this.getLayout(toRaw(parentNode), addNode as MNode);
    const newNode = { ...toRaw(await propsService.getPropsValue(type, config)) };
    newNode.style = getInitPositionStyle(newNode.style, layout, parentNode, this.get<StageCore>('stage'));

    if ((parentNode?.type === NodeType.ROOT || curNode.type === NodeType.ROOT) && newNode.type !== NodeType.PAGE) {
      throw new Error('app?????????????????????');
    }

    parentNode?.items?.push(newNode);

    const stage = this.get<StageCore | null>('stage');
    const root = this.get<MApp>('root');

    await stage?.add({ config: cloneDeep(newNode), parent: cloneDeep(parentNode), root: cloneDeep(root) });

    if (layout === Layout.ABSOLUTE) {
      const fixedLeft = fixNodeLeft(newNode, parentNode, stage?.renderer.contentWindow?.document);
      if (typeof fixedLeft !== 'undefined') {
        newNode.style.left = fixedLeft;
        await stage?.update({ config: cloneDeep(newNode), root: cloneDeep(root) });
      }
    }

    await this.select(newNode);

    this.addModifiedNodeId(newNode.id);
    if (!isPage) {
      this.pushHistoryState();
    }

    if (isPage) {
      this.state.pageLength += 1;
    } else {
      // ????????????????????????????????????????????????????????????select???????????????runtime-ready???????????????select
      stage?.select(newNode.id);
    }

    this.emit('add', newNode);

    return newNode;
  }

  /**
   * ????????????
   * @param {Object} node
   * @return {Object} ?????????????????????
   */
  public async remove(node: MNode): Promise<MNode | void> {
    if (!node?.id) return;

    const root = this.get<MApp | null>('root');

    if (!root) throw new Error('??????root');

    const { parent, node: curNode } = this.getNodeInfo(node.id, false);

    if (!parent || !curNode) throw new Error('????????????????????????');

    const index = getNodeIndex(curNode, parent);

    if (typeof index !== 'number' || index === -1) throw new Error('????????????????????????');

    parent.items?.splice(index, 1);
    const stage = this.get<StageCore | null>('stage');
    stage?.remove({ id: node.id, root: cloneDeep(this.get('root')) });

    if (node.type === NodeType.PAGE) {
      this.state.pageLength -= 1;

      if (root.items[0]) {
        await this.select(root.items[0]);
        stage?.select(root.items[0].id);
      } else {
        this.set('node', null);
        this.set('parent', null);
        this.set('page', null);
        this.set('stage', null);
        this.set('highlightNode', null);
        this.resetModifiedNodeId();
        historyService.reset();

        this.emit('remove', node);

        return node;
      }
    } else {
      await this.select(parent);
      stage?.select(parent.id);
    }

    this.addModifiedNodeId(parent.id);
    this.pushHistoryState();

    this.emit('remove', node);

    return node;
  }

  /**
   * ????????????
   * @param config ???????????????????????????????????????id??????
   * @returns ????????????????????????
   */
  public async update(config: MNode): Promise<MNode> {
    if (!config?.id) throw new Error('??????????????????????????????id???');

    const info = this.getNodeInfo(config.id, false);

    if (!info.node) throw new Error(`????????????id???${config.id}?????????`);

    const node = cloneDeep(toRaw(info.node));

    let newConfig = await this.toggleFixedPosition(toRaw(config), node, this.get<MApp>('root'));

    newConfig = mergeWith(cloneDeep(node), newConfig, (objValue, srcValue) => {
      if (Array.isArray(srcValue)) {
        return srcValue;
      }
    });

    if (!newConfig.type) throw new Error('????????????type???');

    if (newConfig.type === NodeType.ROOT) {
      this.set('root', newConfig);
      return newConfig;
    }

    const { parent } = info;
    if (!parent) throw new Error('????????????????????????');

    const parentNodeItems = parent.items;
    const index = getNodeIndex(newConfig, parent);

    if (!parentNodeItems || typeof index === 'undefined' || index === -1) throw new Error('????????????????????????');

    const newLayout = await this.getLayout(newConfig);
    const layout = await this.getLayout(node);
    if (newLayout !== layout) {
      newConfig = setLayout(newConfig, newLayout);
    }

    parentNodeItems[index] = newConfig;

    if (`${newConfig.id}` === `${this.get('node').id}`) {
      this.set('node', newConfig);
    }

    this.get<StageCore | null>('stage')?.update({ config: cloneDeep(newConfig), root: cloneDeep(this.get('root')) });

    if (newConfig.type === NodeType.PAGE) {
      this.set('page', newConfig);
    }

    this.addModifiedNodeId(newConfig.id);
    this.pushHistoryState();

    this.emit('update', newConfig);

    return newConfig;
  }

  /**
   * ???id???id1??????????????????id???id2??????????????????????????????[1,2,3,4] -> sort(1,3) -> [2,1,3,4]
   * @param id1 ??????ID
   * @param id2 ??????ID
   * @returns void
   */
  public async sort(id1: Id, id2: Id): Promise<void> {
    const node = this.get<MNode>('node');
    const parent = cloneDeep(toRaw(this.get<MContainer>('parent')));
    const index2 = parent.items.findIndex((node: MNode) => `${node.id}` === `${id2}`);
    // ??? id1 ???????????????????????? id2 ????????? return
    if (index2 < 0) return;
    const index1 = parent.items.findIndex((node: MNode) => `${node.id}` === `${id1}`);

    parent.items.splice(index2, 0, ...parent.items.splice(index1, 1));

    await this.update(parent);
    await this.select(node);

    this.get<StageCore | null>('stage')?.update({ config: cloneDeep(node), root: cloneDeep(this.get('root')) });

    this.addModifiedNodeId(parent.id);
    this.pushHistoryState();
  }

  /**
   * ??????????????????????????????string??????????????????localStorage???
   * @param config ??????????????????
   * @returns ??????????????????
   */
  public async copy(config: MNode): Promise<void> {
    globalThis.localStorage.setItem(COPY_STORAGE_KEY, serialize(config));
  }

  /**
   * ???localStorage????????????????????????????????????????????????
   * @param position ?????????????????????????????????
   * @returns ??????????????????????????????
   */
  public async paste(position: { left?: number; top?: number } = {}): Promise<MNode | void> {
    const configStr = globalThis.localStorage.getItem(COPY_STORAGE_KEY);
    // eslint-disable-next-line prefer-const
    let config: any = {};
    if (!configStr) {
      return;
    }

    try {
      // eslint-disable-next-line no-eval
      eval(`config = ${configStr}`);
    } catch (e) {
      console.error(e);
      return;
    }

    config = await propsService.setNewItemId(config, this.get('root'));
    if (config.style) {
      config.style = {
        ...config.style,
        ...position,
      };
    }

    if (isPage(config)) {
      config.name = generatePageNameByApp(this.get('root'));
    }

    return await this.add(config);
  }

  /**
   * ???????????????????????????
   * @param config ??????????????????
   * @returns ????????????????????????
   */
  public async alignCenter(config: MNode): Promise<MNode | void> {
    const parent = this.get<MContainer>('parent');
    const node = this.get<MNode>('node');
    const layout = await this.getLayout(toRaw(parent), toRaw(node));
    if (layout === Layout.RELATIVE) {
      return;
    }

    if (!node.style) return;

    const stage = this.get<StageCore>('stage');
    const doc = stage?.renderer.contentWindow?.document;

    if (doc) {
      const el = doc.getElementById(`${node.id}`);
      const parentEl = el?.offsetParent;
      if (parentEl && el) {
        node.style.left = (parentEl.clientWidth - el.clientWidth) / 2;
      }
    } else if (parent.style && isNumber(parent.style?.width) && isNumber(node.style?.width)) {
      node.style.left = (parent.style.width - node.style.width) / 2;
    }

    await this.update(node);
    this.get<StageCore | null>('stage')?.update({
      config: cloneDeep(toRaw(node)),
      root: cloneDeep(this.get<MApp>('root')),
    });
    this.addModifiedNodeId(config.id);
    this.pushHistoryState();

    return config;
  }

  /**
   * ??????????????????????????????
   * @param offset ?????????
   */
  public async moveLayer(offset: number | LayerOffset): Promise<void> {
    const parent = this.get<MContainer>('parent');
    const node = this.get('node');
    const brothers: MNode[] = parent?.items || [];
    const index = brothers.findIndex((item) => `${item.id}` === `${node?.id}`);

    if (offset === LayerOffset.TOP) {
      brothers.splice(brothers.length - 1, 0, brothers.splice(index, 1)[0]);
    } else if (offset === LayerOffset.BOTTOM) {
      brothers.splice(0, 0, brothers.splice(index, 1)[0]);
    } else {
      brothers.splice(index + parseInt(`${offset}`, 10), 0, brothers.splice(index, 1)[0]);
    }

    this.get<StageCore | null>('stage')?.update({
      config: cloneDeep(toRaw(parent)),
      root: cloneDeep(this.get<MApp>('root')),
    });
  }

  /**
   * ????????????????????????
   * @param config ?????????????????????
   * @param targetId ??????ID
   */
  public async moveToContainer(config: MNode, targetId: Id): Promise<MNode | undefined> {
    const { node, parent } = this.getNodeInfo(config.id, false);
    const target = this.getNodeById(targetId, false) as MContainer;

    const stage = this.get<StageCore | null>('stage');

    if (node && parent && stage) {
      const root = cloneDeep(this.get<MApp>('root'));
      const index = getNodeIndex(node, parent);
      parent.items?.splice(index, 1);

      await stage.remove({ id: node.id, root });

      const layout = await this.getLayout(target);

      const newConfig = mergeWith(cloneDeep(node), config, (objValue, srcValue) => {
        if (Array.isArray(srcValue)) {
          return srcValue;
        }
      });
      newConfig.style = getInitPositionStyle(newConfig.style, layout, target, stage);

      target.items.push(newConfig);

      await stage.select(targetId);

      await stage.update({ config: cloneDeep(target), root });

      await this.select(newConfig);
      stage.select(newConfig.id);

      this.addModifiedNodeId(target.id);
      this.addModifiedNodeId(parent.id);
      this.pushHistoryState();

      return newConfig;
    }
  }

  /**
   * ??????????????????
   * @returns ???????????????
   */
  public async undo(): Promise<StepValue | null> {
    const value = historyService.undo();
    await this.changeHistoryState(value);
    return value;
  }

  /**
   * ??????????????????
   * @returns ???????????????
   */
  public async redo(): Promise<StepValue | null> {
    const value = historyService.redo();
    await this.changeHistoryState(value);
    return value;
  }

  public async move(left: number, top: number) {
    const node = toRaw(this.get('node'));
    if (!node || isPage(node)) return;

    const { style, id } = node;
    if (!style || style.position !== 'absolute') return;

    if (top && !isNumber(style.top)) return;
    if (left && !isNumber(style.left)) return;

    this.update({
      id,
      style: {
        ...style,
        left: Number(style.left) + left,
        top: Number(style.top) + top,
      },
    });
  }

  public destroy() {
    this.removeAllListeners();
    this.set('root', null);
    this.set('node', null);
    this.set('page', null);
    this.set('parent', null);
  }

  public resetModifiedNodeId() {
    this.get<Map<Id, Id>>('modifiedNodeIds').clear();
  }

  private addModifiedNodeId(id: Id) {
    if (!this.isHistoryStateChange) {
      this.get<Map<Id, Id>>('modifiedNodeIds').set(id, id);
    }
  }

  private pushHistoryState() {
    const curNode = cloneDeep(toRaw(this.get('node')));
    if (!this.isHistoryStateChange) {
      historyService.push({
        data: cloneDeep(toRaw(this.get('page'))),
        modifiedNodeIds: this.get<Map<Id, Id>>('modifiedNodeIds'),
        nodeId: curNode.id,
      });
    }
    this.isHistoryStateChange = false;
  }

  private async changeHistoryState(value: StepValue | null) {
    if (!value) return;

    this.isHistoryStateChange = true;
    await this.update(value.data);
    this.set('modifiedNodeIds', value.modifiedNodeIds);
    setTimeout(async () => {
      if (!value.nodeId) return;
      await this.select(value.nodeId);
      this.get<StageCore | null>('stage')?.select(value.nodeId);
    }, 0);
  }

  private async toggleFixedPosition(dist: MNode, src: MNode, root: MApp) {
    const newConfig = cloneDeep(dist);

    if (!isPop(src) && newConfig.style?.position) {
      if (isFixed(newConfig) && !isFixed(src)) {
        newConfig.style = change2Fixed(newConfig, root);
      } else if (!isFixed(newConfig) && isFixed(src)) {
        newConfig.style = await Fixed2Other(newConfig, root, this.getLayout);
      }
    }

    return newConfig;
  }

  private selectedConfigExceptionHandler(config: MNode | Id): EditorNodeInfo {
    let id: Id;
    if (typeof config === 'string' || typeof config === 'number') {
      id = config;
    } else {
      id = config.id;
    }
    if (!id) {
      throw new Error('??????ID???????????????');
    }

    const { node, parent, page } = this.getNodeInfo(id);
    if (!node) throw new Error('????????????????????????');

    if (node.id === this.state.root?.id) {
      throw new Error('??????????????????');
    }
    return {
      node,
      parent,
      page,
    };
  }
}

export type EditorService = Editor;

export default new Editor();
