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

import { reactive } from 'vue';
import { cloneDeep, get, keys, pick } from 'lodash-es';
import type { Writable } from 'type-fest';

import type { CodeBlockContent, CodeBlockDSL, Id, MNode, TargetOptions } from '@tmagic/core';
import { Target, Watcher } from '@tmagic/core';
import type { TableColumnConfig } from '@tmagic/form';
import { getValueByKeyPath, setValueByKeyPath } from '@tmagic/utils';

import editorService from '@editor/services/editor';
import historyService from '@editor/services/history';
import storageService, { Protocol } from '@editor/services/storage';
import type {
  AsyncHookPlugin,
  CodeBlockStepValue,
  CodeState,
  HistoryOpOptions,
  HistoryOpOptionsWithChangeRecords,
} from '@editor/type';
import { CODE_DRAFT_STORAGE_KEY } from '@editor/type';
import { getEditorConfig } from '@editor/utils/config';
import { COPY_CODE_STORAGE_KEY } from '@editor/utils/editor';

import BaseService from './BaseService';

const canUsePluginMethods = {
  async: ['setCodeDslById', 'setEditStatus', 'setCombineIds', 'setUndeleteableList', 'deleteCodeDslByIds'] as const,
  sync: ['setCodeDslByIdSync'],
};

type AsyncMethodName = Writable<(typeof canUsePluginMethods)['async']>;

/**
 * 「回滚」生成的新 step 简短描述。仅 service 层使用。
 */
const describeRevertCodeBlockStep = (step: CodeBlockStepValue): string => {
  const { oldContent, newContent, changeRecords, id } = step;
  if (oldContent === null && newContent) return `撤回新增 ${newContent.name || newContent.id || id}`;
  if (oldContent && newContent === null) return `还原已删除的 ${oldContent.name || oldContent.id || id}`;
  const name = newContent?.name || oldContent?.name || `${id}`;
  const propPath = changeRecords?.[0]?.propPath;
  return propPath ? `还原 ${name} · ${propPath}` : `还原 ${name}`;
};

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
   * @param options 可选配置
   * @param options.changeRecords form 端 propPath/value 列表，用于历史记录的精细化撤销/重做
   * @param options.doNotPushHistory 是否不写入历史记录（默认 false）
   * @returns {void}
   */
  public async setCodeDslById(
    id: Id,
    codeConfig: Partial<CodeBlockContent>,
    {
      changeRecords,
      doNotPushHistory = false,
      historyDescription,
      historySource,
    }: HistoryOpOptionsWithChangeRecords = {},
  ): Promise<void> {
    this.setCodeDslByIdSync(id, codeConfig, true, {
      changeRecords,
      doNotPushHistory,
      historyDescription,
      historySource,
    });
  }

  /**
   * 为了兼容历史原因
   * 设置代码块ID和代码内容到源dsl
   * @param {Id} id 代码块id
   * @param {CodeBlockContent} codeConfig 代码块内容配置信息
   * @param {boolean} force 是否强制写入，默认true
   * @param options 可选配置
   * @param options.changeRecords form 端 propPath/value 列表，用于历史记录的精细化撤销/重做
   * @param options.doNotPushHistory 是否不写入历史记录（默认 false）
   * @param options.historyDescription 入栈时附带的人类可读描述，用于历史面板展示
   * @returns {void}
   */
  public setCodeDslByIdSync(
    id: Id,
    codeConfig: Partial<CodeBlockContent>,
    force = true,
    {
      changeRecords,
      doNotPushHistory = false,
      historyDescription,
      historySource,
    }: HistoryOpOptionsWithChangeRecords = {},
  ): void {
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

    // 历史记录：在写入前快照旧内容，区分新增/更新
    const oldContent: CodeBlockContent | null = codeDsl[id] ? cloneDeep(codeDsl[id]) : null;

    const existContent = codeDsl[id] || {};

    codeDsl[id] = {
      ...existContent,
      ...codeConfigProcessed,
    };

    const newContent = cloneDeep(codeDsl[id]);

    if (!doNotPushHistory) {
      historyService.pushCodeBlock(id, {
        oldContent,
        newContent,
        changeRecords,
        historyDescription,
        source: historySource,
      });
    }

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
   * @param options 可选配置
   * @param options.doNotPushHistory 是否不写入历史记录（默认 false）
   */
  public async deleteCodeDslByIds(
    codeIds: Id[],
    { doNotPushHistory = false, historyDescription, historySource }: HistoryOpOptions = {},
  ): Promise<void> {
    const currentDsl = await this.getCodeDsl();

    if (!currentDsl) return;

    codeIds.forEach((id) => {
      // 历史记录：删除前快照内容；不存在的 id 直接跳过历史推入
      const oldContent: CodeBlockContent | null = currentDsl[id] ? cloneDeep(currentDsl[id]) : null;

      delete currentDsl[id];

      if (oldContent && !doNotPushHistory) {
        historyService.pushCodeBlock(id, { oldContent, newContent: null, historyDescription, source: historySource });
      }

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
   * 撤销指定代码块的最近一次变更。
   *
   * 内部走 setCodeDslByIdSync / deleteCodeDslByIds，因此会自动触发 codeBlockService 的
   * `addOrUpdate` / `remove` 事件，由 initService 中的 handler 重新维护 dep target
   * （DepTargetType.CODE_BLOCK 的 add / remove）。所有写回都带 `doNotPushHistory: true`，
   * 确保不会在历史栈里产生新的记录。
   *
   * @param id 代码块 id
   * @returns 撤销的 step；栈不存在或已无可撤销时返回 null
   */
  public async undo(id: Id): Promise<CodeBlockStepValue | null> {
    const step = historyService.undoCodeBlock(id);
    if (!step) return null;
    await this.applyHistoryStep(step, true);
    return step;
  }

  /**
   * 重做指定代码块的下一次变更。
   * @param id 代码块 id
   * @returns 重做的 step；栈不存在或已无可重做时返回 null
   */
  public async redo(id: Id): Promise<CodeBlockStepValue | null> {
    const step = historyService.redoCodeBlock(id);
    if (!step) return null;
    await this.applyHistoryStep(step, false);
    return step;
  }

  /** 是否可对指定代码块撤销。 */
  public canUndo(id: Id): boolean {
    return historyService.canUndoCodeBlock(id);
  }

  /** 是否可对指定代码块重做。 */
  public canRedo(id: Id): boolean {
    return historyService.canRedoCodeBlock(id);
  }

  /**
   * 跳转指定代码块的历史栈到目标游标。语义同 editor.gotoPageStep。
   *
   * @param id          代码块 id
   * @param targetCursor 目标游标位置（已应用步骤数量）
   * @returns 实际移动到的最终游标位置
   */
  public async goto(id: Id, targetCursor: number): Promise<number> {
    let cursor = historyService.getCodeBlockCursor(id);
    const target = Math.max(0, targetCursor);
    while (cursor > target) {
      const step = await this.undo(id);
      if (!step) break;
      cursor -= 1;
    }
    while (cursor < target) {
      const step = await this.redo(id);
      if (!step) break;
      cursor += 1;
    }
    return cursor;
  }

  /**
   * 「回滚」指定代码块历史步骤（类 git revert 语义）：
   * - 不动原始栈结构（不移动 cursor、不丢弃任何步骤）；
   * - 把目标 step 的修改**反向应用**一次，并作为**新步骤**追加到栈顶；
   * - 仅对已应用的步骤生效。
   *
   * @param id    代码块 id
   * @param index 目标 step 在该栈中的索引（0 为最早），通常由历史面板传入
   * @returns 反向后产生的新 step；目标不存在 / 未应用时返回 null
   */
  public async revert(id: Id, index: number): Promise<CodeBlockStepValue | null> {
    const list = historyService.getCodeBlockStepList(id);
    const entry = list[index];
    if (!entry?.applied) return null;
    // 更新类步骤（前后 content 都存在）必须带 changeRecords 才支持回滚，否则只能整内容替换，会冲掉后续无关变更。
    if (entry.step.oldContent && entry.step.newContent && !entry.step.changeRecords?.length) return null;
    const description = `回滚 #${index + 1}: ${describeRevertCodeBlockStep(entry.step)}`;
    return await this.applyRevertStep(entry.step, description);
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

  /**
   * 反向应用一个 step 并以新 step 入栈。逻辑与 applyHistoryStep(reverse=true) 同构，
   * 差异仅在于通过公开的 setCodeDslByIdSync / deleteCodeDslByIds 触发 push。
   */
  private async applyRevertStep(
    step: CodeBlockStepValue,
    historyDescription: string,
  ): Promise<CodeBlockStepValue | null> {
    const { id, oldContent, newContent, changeRecords } = step;

    // 原本是新增 → revert 即删除
    if (oldContent === null && newContent) {
      await this.deleteCodeDslByIds([id], { historyDescription, historySource: 'rollback' });
      return historyService.getCodeBlockStepList(id).slice(-1)[0]?.step ?? null;
    }

    // 原本是删除 → revert 即写回
    if (oldContent && newContent === null) {
      this.setCodeDslByIdSync(id, cloneDeep(oldContent), true, { historyDescription, historySource: 'rollback' });
      return historyService.getCodeBlockStepList(id).slice(-1)[0]?.step ?? null;
    }

    if (!oldContent || !newContent) return null;

    // 原本是更新 → 把 oldContent 写回；优先按 changeRecords 局部 patch
    if (changeRecords?.length) {
      const current = this.getCodeContentById(id);
      if (!current) return null;
      const patched = cloneDeep(current) as CodeBlockContent;
      let fallbackToFullReplace = false;
      for (const record of changeRecords) {
        if (!record.propPath) {
          fallbackToFullReplace = true;
          break;
        }
        const value = cloneDeep(getValueByKeyPath(record.propPath, oldContent));
        setValueByKeyPath(record.propPath, value, patched);
      }
      this.setCodeDslByIdSync(id, fallbackToFullReplace ? cloneDeep(oldContent) : patched, true, {
        changeRecords,
        historyDescription,
        historySource: 'rollback',
      });
      return historyService.getCodeBlockStepList(id).slice(-1)[0]?.step ?? null;
    }

    this.setCodeDslByIdSync(id, cloneDeep(oldContent), true, { historyDescription, historySource: 'rollback' });
    return historyService.getCodeBlockStepList(id).slice(-1)[0]?.step ?? null;
  }

  /**
   * 把一条历史 step 应用到当前代码块服务上。
   *
   * 复用现有的 setCodeDslByIdSync / deleteCodeDslByIds，目的是借助它们发出的事件
   * 触发 initService 中的 dep target 维护（CODE_BLOCK 的 add / remove）。
   * 所有写回都带 `doNotPushHistory: true`，确保不会在历史栈里产生新的记录。
   *
   * - oldContent=null, newContent≠null：原始为新增 → undo 删除；redo 再次 setCodeDslByIdSync
   * - oldContent≠null, newContent=null：原始为删除 → undo 还原写入；redo 再次删除
   * - 两侧都有：原始为更新 → 按 changeRecords 局部 patch；缺省退化为整内容替换
   *
   * @param step 历史 step
   * @param reverse true=撤销，false=重做
   */
  private async applyHistoryStep(step: CodeBlockStepValue, reverse: boolean): Promise<void> {
    const { id, oldContent, newContent, changeRecords } = step;

    // 新增 / 删除：直接 set 或 delete，不走 patch 逻辑
    if (oldContent === null && newContent) {
      if (reverse) {
        await this.deleteCodeDslByIds([id], { doNotPushHistory: true });
      } else {
        this.setCodeDslByIdSync(id, cloneDeep(newContent), true, { doNotPushHistory: true });
      }
      return;
    }

    if (oldContent && newContent === null) {
      if (reverse) {
        this.setCodeDslByIdSync(id, cloneDeep(oldContent), true, { doNotPushHistory: true });
      } else {
        await this.deleteCodeDslByIds([id], { doNotPushHistory: true });
      }
      return;
    }

    if (!oldContent || !newContent) return;

    // 更新场景：优先按 changeRecords 局部 patch；缺省退化为整内容替换
    const sourceForValues = reverse ? oldContent : newContent;

    if (changeRecords?.length) {
      const current = this.getCodeContentById(id);
      if (!current) return;
      const patched = cloneDeep(current) as CodeBlockContent;
      let fallbackToFullReplace = false;
      for (const record of changeRecords) {
        if (!record.propPath) {
          fallbackToFullReplace = true;
          break;
        }
        const value = cloneDeep(getValueByKeyPath(record.propPath, sourceForValues));
        setValueByKeyPath(record.propPath, value, patched);
      }
      this.setCodeDslByIdSync(id, fallbackToFullReplace ? cloneDeep(sourceForValues) : patched, true, {
        changeRecords,
        doNotPushHistory: true,
      });
      return;
    }

    this.setCodeDslByIdSync(id, cloneDeep(sourceForValues), true, { doNotPushHistory: true });
  }
}

export type CodeBlockService = CodeBlock;

export default new CodeBlock();
