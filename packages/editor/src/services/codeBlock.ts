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

import { reactive } from 'vue';
import { cloneDeep, get, keys, pick } from 'lodash-es';
import type { Writable } from 'type-fest';

import type { CodeBlockContent, CodeBlockDSL, Id, MNode, TargetOptions } from '@tmagic/core';
import { Target, Watcher } from '@tmagic/core';
import type { TableColumnConfig } from '@tmagic/form';

import editorService from '@editor/services/editor';
import storageService, { Protocol } from '@editor/services/storage';
import type { AsyncHookPlugin, CodeState } from '@editor/type';
import { CODE_DRAFT_STORAGE_KEY } from '@editor/type';
import { getEditorConfig } from '@editor/utils/config';
import { COPY_CODE_STORAGE_KEY } from '@editor/utils/editor';

import BaseService from './BaseService';

const canUsePluginMethods = {
  async: ['setCodeDslById', 'setEditStatus', 'setCombineIds', 'setUndeleteableList', 'deleteCodeDslByIds'] as const,
  sync: ['setCodeDslByIdSync'],
};

type AsyncMethodName = Writable<(typeof canUsePluginMethods)['async']>;

class CodeBlock extends BaseService {
  private state = reactive<CodeState>({
    codeDsl: null,
    editable: true,
    combineIds: [],
    undeletableList: [],
    paramsColConfig: undefined,
  });

  constructor() {
    super([
      ...canUsePluginMethods.async.map((methodName) => ({ name: methodName, isAsync: true })),
      ...canUsePluginMethods.sync.map((methodName) => ({ name: methodName, isAsync: false })),
    ]);
  }

  /**
   * 设置活动的代码块dsl数据源
   * @param {CodeBlockDSL} codeDsl 代码DSL
   * @returns {void}
   */
  public async setCodeDsl(codeDsl: CodeBlockDSL): Promise<void> {
    this.state.codeDsl = codeDsl;
    this.emit('code-dsl-change', this.state.codeDsl);
  }

  /**
   * 获取活动的代码块dsl数据源（默认从dsl中的codeBlocks字段读取）
   * 方法要支持钩子添加扩展，会被重写为异步方法,因此这里显示写为异步以提醒调用者需以异步形式调用
   * @param {boolean} forceRefresh 是否强制从活动dsl拉取刷新
   * @returns {CodeBlockDSL | null}
   */
  public getCodeDsl(): CodeBlockDSL | null {
    return this.state.codeDsl;
  }

  /**
   * 根据代码块id获取代码块内容
   * @param {Id} id 代码块id
   * @returns {CodeBlockContent | null}
   */
  public getCodeContentById(id: Id): CodeBlockContent | null {
    if (!id) return null;
    const totalCodeDsl = this.getCodeDsl();
    if (!totalCodeDsl) return null;
    return totalCodeDsl[id] ?? null;
  }

  /**
   * 设置代码块ID和代码内容到源dsl
   * @param {Id} id 代码块id
   * @param {CodeBlockContent} codeConfig 代码块内容配置信息
   * @returns {void}
   */
  public async setCodeDslById(id: Id, codeConfig: Partial<CodeBlockContent>): Promise<void> {
    this.setCodeDslByIdSync(id, codeConfig, true);
  }

  /**
   * 为了兼容历史原因
   * 设置代码块ID和代码内容到源dsl
   * @param {Id} id 代码块id
   * @param {CodeBlockContent} codeConfig 代码块内容配置信息
   * @param {boolean} force 是否强制写入，默认true
   * @returns {void}
   */
  public setCodeDslByIdSync(id: Id, codeConfig: Partial<CodeBlockContent>, force = true): void {
    const codeDsl = this.getCodeDsl();

    if (!codeDsl) {
      throw new Error('dsl中没有codeBlocks');
    }
    if (codeDsl[id] && !force) return;

    const codeConfigProcessed = cloneDeep(codeConfig);
    if (codeConfigProcessed.content) {
      // 在保存的时候转换代码内容
      const parseDSL = getEditorConfig('parseDSL');
      if (typeof codeConfigProcessed.content === 'string') {
        codeConfigProcessed.content = parseDSL<(...args: any[]) => any>(codeConfigProcessed.content);
      }
    }

    const existContent = codeDsl[id] || {};

    codeDsl[id] = {
      ...existContent,
      ...codeConfigProcessed,
    };

    this.emit('addOrUpdate', id, codeDsl[id]);
  }

  /**
   * 根据代码块id数组获取代码dsl
   * @param {string[]} ids 代码块id数组
   * @returns {CodeBlockDSL}
   */
  public getCodeDslByIds(ids: string[]): CodeBlockDSL {
    const codeDsl = this.getCodeDsl();
    return pick(codeDsl, ids) as CodeBlockDSL;
  }

  /**
   * 获取编辑状态
   * @returns {boolean} 是否可编辑
   */
  public getEditStatus(): boolean {
    return this.state.editable;
  }

  /**
   * 设置编辑状态
   * @param {boolean} status 是否可编辑
   * @returns {void}
   */
  public async setEditStatus(status: boolean): Promise<void> {
    this.state.editable = status;
  }

  /**
   * 设置当前选中组件已关联绑定的代码块id数组
   * @param {string[]} ids 代码块id数组
   * @returns {void}
   */
  public async setCombineIds(ids: string[]): Promise<void> {
    this.state.combineIds = ids;
  }

  /**
   * 获取当前选中组件已关联绑定的代码块id数组
   * @returns {string[]}
   */
  public getCombineIds(): string[] {
    return this.state.combineIds;
  }

  /**
   * 获取不可删除列表
   * @returns {Id[]}
   */
  public getUndeletableList(): Id[] {
    return this.state.undeletableList;
  }

  /**
   * 设置不可删除列表：为业务逻辑预留的不可删除的代码块列表，由业务逻辑维护（如代码块上线后不可删除）
   * @param {Id[]} codeIds 代码块id数组
   * @returns {void}
   */
  public async setUndeleteableList(codeIds: Id[]): Promise<void> {
    this.state.undeletableList = codeIds;
  }

  /**
   * 设置代码草稿
   */
  public setCodeDraft(codeId: Id, content: string): void {
    globalThis.localStorage.setItem(`${CODE_DRAFT_STORAGE_KEY}_${codeId}`, content);
  }

  /**
   * 获取代码草稿
   */
  public getCodeDraft(codeId: Id): string | null {
    return globalThis.localStorage.getItem(`${CODE_DRAFT_STORAGE_KEY}_${codeId}`);
  }

  /**
   * 删除代码草稿
   */
  public removeCodeDraft(codeId: Id): void {
    globalThis.localStorage.removeItem(`${CODE_DRAFT_STORAGE_KEY}_${codeId}`);
  }

  /**
   * 在dsl数据源中删除指定id的代码块
   * @param {Id[]} codeIds 需要删除的代码块id数组
   */
  public async deleteCodeDslByIds(codeIds: Id[]): Promise<void> {
    const currentDsl = await this.getCodeDsl();

    if (!currentDsl) return;

    codeIds.forEach((id) => {
      delete currentDsl[id];

      this.emit('remove', id);
    });
  }

  public setParamsColConfig(config: TableColumnConfig): void {
    this.state.paramsColConfig = config;
  }

  public getParamsColConfig(): TableColumnConfig | undefined {
    return this.state.paramsColConfig;
  }

  /**
   * 生成代码块唯一id
   * @returns {Id} 代码块唯一id
   */
  public async getUniqueId(): Promise<string> {
    const newId = `code_${Math.random().toString(10).substring(2).substring(0, 4)}`;
    // 判断是否重复
    const dsl = await this.getCodeDsl();
    const existedIds = keys(dsl);
    if (!existedIds.includes(newId)) return newId;
    return await this.getUniqueId();
  }

  /**
   * 复制时会带上组件关联的代码块
   * @param config 组件节点配置
   * @returns
   */
  public copyWithRelated(config: MNode | MNode[], collectorOptions?: TargetOptions): void {
    const copyNodes: MNode[] = Array.isArray(config) ? config : [config];
    const copyData: CodeBlockDSL = {};

    if (collectorOptions && typeof collectorOptions.isTarget === 'function') {
      const customTarget = new Target({
        ...collectorOptions,
      });

      const coperWatcher = new Watcher();

      coperWatcher.addTarget(customTarget);

      coperWatcher.collect(copyNodes, {}, true, collectorOptions.type);

      Object.keys(customTarget.deps).forEach((nodeId: Id) => {
        const node = editorService.getNodeById(nodeId);
        if (!node) return;
        customTarget!.deps[nodeId].keys.forEach((key) => {
          const relateCodeId = get(node, key);
          const isExist = Object.keys(copyData).find((codeId: Id) => codeId === relateCodeId);
          if (!isExist) {
            const relateCode = this.getCodeContentById(relateCodeId);
            if (relateCode) {
              copyData[relateCodeId] = relateCode;
            }
          }
        });
      });
    }
    storageService.setItem(COPY_CODE_STORAGE_KEY, copyData, {
      protocol: Protocol.OBJECT,
    });
  }

  /**
   * 粘贴代码块
   * @returns
   */
  public paste() {
    const codeDsl: CodeBlockDSL = storageService.getItem(COPY_CODE_STORAGE_KEY);
    Object.keys(codeDsl).forEach((codeId: Id) => {
      // 不覆盖同样id的代码块
      this.setCodeDslByIdSync(codeId, codeDsl[codeId], false);
    });
  }

  public resetState() {
    this.state.codeDsl = null;
    this.state.editable = true;
    this.state.combineIds = [];
    this.state.undeletableList = [];
  }

  public destroy(): void {
    this.resetState();
    this.removeAllListeners();
    this.removeAllPlugins();
  }

  public usePlugin(options: AsyncHookPlugin<AsyncMethodName, CodeBlock>): void {
    super.usePlugin(options);
  }
}

export type CodeBlockService = CodeBlock;

export default new CodeBlock();
