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

import { reactive } from 'vue';
import { cloneDeep, forIn, isEmpty, keys, omit, pick } from 'lodash-es';

import { Id, MNode } from '@tmagic/schema';

import editorService from '../services/editor';
import type { CodeBlockContent, CodeBlockDSL, CodeState } from '../type';
import { CodeEditorMode, CodeSelectOp } from '../type';
import { error, info } from '../utils/logger';

import BaseService from './BaseService';

class CodeBlock extends BaseService {
  private state = reactive<CodeState>({
    isShowCodeEditor: false,
    codeDsl: null,
    id: '',
    editable: true,
    mode: CodeEditorMode.EDITOR,
    combineIds: [],
    undeletableList: [],
  });

  constructor() {
    super([
      'setCodeDsl',
      'getCodeDsl',
      'getCodeContentById',
      'getCodeDslByIds',
      'getCurrentDsl',
      'setCodeDslById',
      'setCodeEditorShowStatus',
      'setEditStatus',
      'setMode',
      'setCombineIds',
      'setUndeleteableList',
      'deleteCodeDslByIds',
    ]);
  }

  /**
   * 设置活动的代码块dsl数据源
   * @param {CodeBlockDSL} codeDsl 代码DSL
   * @returns {void}
   */
  public async setCodeDsl(codeDsl: CodeBlockDSL): Promise<void> {
    this.state.codeDsl = codeDsl;
    await editorService.setCodeDsl(this.state.codeDsl);
    info('[code-block]:code-dsl-change', this.state.codeDsl);
    this.emit('code-dsl-change', this.state.codeDsl);
  }

  /**
   * 获取活动的代码块dsl数据源（默认从dsl中的codeBlock字段读取）
   * @param {boolean} forceRefresh 是否强制从活动dsl拉取刷新
   * @returns {CodeBlockDSL | null}
   */
  public async getCodeDsl(forceRefresh = false): Promise<CodeBlockDSL | null> {
    if (!this.state.codeDsl || forceRefresh) {
      this.state.codeDsl = await editorService.getCodeDsl();
    }
    return this.state.codeDsl;
  }

  /**
   * 根据代码块id获取代码块内容
   * @param {string} id 代码块id
   * @returns {CodeBlockContent | null}
   */
  public async getCodeContentById(id: string): Promise<CodeBlockContent | null> {
    if (!id) return null;
    const totalCodeDsl = await this.getCodeDsl();
    if (!totalCodeDsl) return null;
    return totalCodeDsl[id] ?? null;
  }

  /**
   * 设置代码块ID和代码内容到源dsl
   * @param {string} id 代码块id
   * @param {CodeBlockContent} codeConfig 代码块内容配置信息
   * @returns {void}
   */
  public async setCodeDslById(id: string, codeConfig: CodeBlockContent): Promise<void> {
    let codeDsl = await this.getCodeDsl();
    if (!codeDsl) return;
    const existContent = codeDsl[id] || {};
    codeDsl = {
      ...codeDsl,
      [id]: {
        ...existContent,
        ...codeConfig,
      },
    };
    await this.setCodeDsl(codeDsl);
  }

  /**
   * 根据代码块id数组获取代码dsl
   * @param {string[]} ids 代码块id数组
   * @returns {CodeBlockDSL}
   */
  public async getCodeDslByIds(ids: string[]): Promise<CodeBlockDSL> {
    const codeDsl = await this.getCodeDsl();
    return pick(codeDsl, ids) as CodeBlockDSL;
  }

  /**
   * 设置代码编辑面板展示状态
   * @param {boolean} status 是否展示代码编辑面板
   * @returns {void}
   */
  public async setCodeEditorShowStatus(status: boolean): Promise<void> {
    this.state.isShowCodeEditor = status;
  }

  /**
   * 获取代码编辑面板展示状态
   * @returns {boolean} 是否展示代码编辑面板
   */
  public getCodeEditorShowStatus(): boolean {
    return this.state.isShowCodeEditor;
  }

  /**
   * 设置代码编辑面板展示状态及展示内容
   * @param {boolean} status 是否展示代码编辑面板
   * @param {string} id 代码块id
   * @returns {void}
   */
  public setCodeEditorContent(status: boolean, id: string): void {
    if (!id) return;
    this.setId(id);
    this.state.isShowCodeEditor = status;
  }

  /**
   * 获取当前选中的代码块内容
   * @returns {CodeBlockContent | null}
   */
  public async getCurrentDsl() {
    return await this.getCodeContentById(this.state.id);
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
   * @param {boolean} 是否可编辑
   * @returns {void}
   */
  public async setEditStatus(status: boolean): Promise<void> {
    this.state.editable = status;
  }

  /**
   * 设置当前选中的代码块ID
   * @param {string} id 代码块id
   * @returns {void}
   */
  public setId(id: string) {
    if (!id) return;
    this.state.id = id;
  }

  /**
   * 获取当前选中的代码块ID
   * @returns {string} id 代码块id
   */
  public getId(): string {
    return this.state.id;
  }

  /**
   * 获取当前模式
   * @returns {CodeEditorMode}
   */
  public getMode(): CodeEditorMode {
    return this.state.mode;
  }

  /**
   * 设置当前模式
   * @param {CodeEditorMode} mode 模式
   * @returns {void}
   */
  public async setMode(mode: CodeEditorMode): Promise<void> {
    this.state.mode = mode;
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
   * 设置绑定关系
   * @param {Id} 组件id
   * @param {string[]} diffCodeIds 代码块id数组
   * @param {CodeSelectOp} opFlag 操作类型
   * @param {string} hook 代码块挂载hook名称
   * @returns {void}
   */
  public async setCombineRelation(compId: Id, diffCodeIds: string[], opFlag: CodeSelectOp, hook: string) {
    const codeDsl = cloneDeep(await this.getCodeDsl());
    if (!codeDsl) return;
    if (opFlag === CodeSelectOp.DELETE) {
      try {
        diffCodeIds.forEach((codeId) => {
          const compsContent = codeDsl[codeId].comps;
          const index = compsContent?.[compId].findIndex((item) => item === hook);
          if (typeof index !== 'undefined' && index !== -1) {
            compsContent?.[compId].splice(index, 1);
          }
        });
      } catch (e) {
        error(e);
        throw new Error('解绑代码块失败');
      }
    } else if (opFlag === CodeSelectOp.ADD) {
      try {
        diffCodeIds.forEach((codeId) => {
          const compsContent = codeDsl[codeId].comps;
          const existHooks = compsContent?.[compId];
          if (isEmpty(existHooks)) {
            // comps属性不存在，或者comps为空：新增
            codeDsl[codeId].comps = {
              ...(codeDsl[codeId].comps || {}),
              [compId]: [hook],
            };
          } else {
            // 往已有的关系中添加hook
            existHooks?.push(hook);
          }
        });
      } catch (e) {
        error(e);
        throw new Error('绑定代码块失败');
      }
    } else if (opFlag === CodeSelectOp.CHANGE) {
      // 单选修改
      forIn(codeDsl, (codeBlockContent, codeId) => {
        if (codeId === diffCodeIds[0]) {
          // 增加
          codeBlockContent.comps = {
            ...(codeBlockContent?.comps || {}),
            [compId]: [hook],
          };
        } else if (isEmpty(diffCodeIds) || codeId !== diffCodeIds[0]) {
          // 清空或者移除之前的选项
          const compHooks = codeBlockContent?.comps?.[compId];
          // continue
          if (!compHooks) return true;
          const index = compHooks.findIndex((hookName) => hookName === hook);
          if (index !== -1) {
            compHooks.splice(index, 1);
            // break
            return false;
          }
        }
      });
    }
    this.setCodeDsl(codeDsl);
  }

  /**
   * 获取不可删除列表
   * @returns {string[]}
   */
  public getUndeletableList(): string[] {
    return this.state.undeletableList;
  }

  /**
   * 设置不可删除列表：为业务逻辑预留的不可删除的代码块列表，由业务逻辑维护（如代码块上线后不可删除）
   * @param {string[]} codeIds 代码块id数组
   * @returns {void}
   */
  public async setUndeleteableList(codeIds: string[]): Promise<void> {
    this.state.undeletableList = codeIds;
  }

  /**
   * 在dsl数据源中删除指定id的代码块
   * @param {string[]} codeIds 需要删除的代码块id数组
   * @returns {CodeBlockDSL} 删除后的code dsl
   */
  public async deleteCodeDslByIds(codeIds: string[]): Promise<CodeBlockDSL> {
    const currentDsl = await this.getCodeDsl();
    const newDsl = omit(currentDsl, codeIds);
    await this.setCodeDsl(newDsl);
    return newDsl;
  }

  /**
   * 生成代码块唯一id
   * @returns {string} 代码块唯一id
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
   * 一对一解除绑定关系  功能隐藏，暂时注释
   * @param {string} compId 组件id
   * @param {string} codeId 代码块id
   * @param {string[]} codeHooks 代码块挂载hook名称
   * @returns {boolean} 结果
   */
  // public async unbind(compId: Id, codeId: string, codeHooks: string[]): Promise<boolean> {
  //   const nodeInfo = editorService.getNodeById(compId);
  //   if (!nodeInfo) return false;
  //   // 更新node节点信息
  //   codeHooks.forEach((hook) => {
  //     if (!isEmpty(nodeInfo[hook])) {
  //       const newHookInfo = nodeInfo[hook].filter((item: string) => item !== codeId);
  //       nodeInfo[hook] = newHookInfo;
  //       editorService.update(nodeInfo);
  //     }
  //   });
  //   // 更新绑定关系
  //   const oldRelation = await this.getCompRelation();
  //   const oldCodeIds = oldRelation[compId];
  //   // 不能直接splice修改原数组,会导致绑定关系更新错乱
  //   const newCodeIds = oldCodeIds.filter((item) => item !== codeId);
  //   this.setCompRelation(compId, newCodeIds);
  //   return true;
  // }

  /**
   * 通过组件id解除绑定关系（删除组件）
   * @param {MNode} compId 组件节点
   * @returns void
   */
  public async deleteCompsInRelation(node: MNode) {
    const codeDsl = cloneDeep(await this.getCodeDsl());
    if (!codeDsl) return;
    this.recurseNodes(node, codeDsl);
    this.setCodeDsl(codeDsl);
  }

  public destroy() {
    this.state.isShowCodeEditor = false;
    this.state.codeDsl = null;
    this.state.id = '';
    this.state.editable = true;
    this.state.mode = CodeEditorMode.EDITOR;
    this.state.combineIds = [];
    this.state.undeletableList = [];
  }

  // 删除组件时 如果是容器 需要遍历删除其包含节点的绑定信息
  private recurseNodes(node: MNode, codeDsl: CodeBlockDSL) {
    if (!node.id) return;
    forIn(codeDsl, (codeBlockContent) => {
      const compsContent = codeBlockContent.comps || {};
      codeBlockContent.comps = omit(compsContent, node.id);
    });
    if (!isEmpty(node.items)) {
      node.items.forEach((item: MNode) => {
        this.recurseNodes(item, codeDsl);
      });
    }
  }
}

export type CodeBlockService = CodeBlock;

export default new CodeBlock();
