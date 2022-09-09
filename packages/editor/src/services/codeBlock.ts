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
import { keys, pick } from 'lodash-es';

import type { CodeBlockContent, CodeBlockDSL, CodeState } from '../type';
import { EditorMode } from '../type';
import { info } from '../utils/logger';

import BaseService from './BaseService';

class CodeBlock extends BaseService {
  private state = reactive<CodeState>({
    isShowCodeEditor: false,
    codeDsl: null,
    id: '',
    editable: true,
    mode: EditorMode.EDITOR,
    combineIds: [],
  });

  constructor() {
    super([]);
  }

  /**
   * 设置活动的代码块dsl数据源
   * @param {CodeBlockDSL} codeDsl 代码DSL
   * @returns {void}
   */
  public setCodeDsl(codeDsl: CodeBlockDSL): void {
    this.state.codeDsl = codeDsl;
    info('[code-block]:code-dsl-change', this.state.codeDsl);
    this.emit('code-dsl-change', this.state.codeDsl);
  }

  /**
   * 获取活动的代码块dsl数据源
   * @returns {CodeBlockDSL | null}
   */
  public getCodeDsl(): CodeBlockDSL | null {
    return this.state.codeDsl;
  }

  /**
   * 根据代码块id获取代码块内容
   * @param {string} id 代码块id
   * @returns {CodeBlockContent | null}
   */
  public getCodeContentById(id: string): CodeBlockContent | null {
    if (!id) return null;
    const totalCodeDsl = this.getCodeDsl();
    if (!totalCodeDsl) return null;
    return totalCodeDsl[id] ?? null;
  }

  /**
   * 设置代码块ID和代码内容到源dsl
   * @param {string} id 代码块id
   * @param {CodeBlockContent} codeConfig 代码块内容配置信息
   * @returns {void}
   */
  public setCodeDslById(id: string, codeConfig: CodeBlockContent): void {
    let codeDsl = this.getCodeDsl();
    codeDsl = {
      ...codeDsl,
      [id]: codeConfig,
    };
    this.setCodeDsl(codeDsl);
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
   * 设置代码编辑面板展示状态
   * @param {boolean} status 是否展示代码编辑面板
   * @returns {void}
   */
  public setCodeEditorShowStatus(status: boolean): void {
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
  public getCurrentDsl() {
    return this.getCodeContentById(this.state.id);
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
  public setEditStatus(status: boolean): void {
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
   * @returns {EditorMode}
   */
  public getMode(): EditorMode {
    return this.state.mode;
  }

  /**
   * 设置当前模式
   * @param {EditorMode} mode 模式
   * @returns {void}
   */
  public setMode(mode: EditorMode): void {
    this.state.mode = mode;
  }

  /**
   * 设置当前已关联绑定的代码块id数组
   * @param {string[]} ids 代码块id数组
   * @returns {void}
   */
  public setCombineIds(ids: string[]): void {
    this.state.combineIds = ids;
  }

  /**
   * 获取当前已关联绑定的代码块id数组
   * @returns {string[]}
   */
  public getCombineIds(): string[] {
    return this.state.combineIds;
  }

  /**
   * 生成代码块唯一id
   * @returns {string} 代码块唯一id
   */
  public getUniqueId(): string {
    const newId = (Date.now().toString(36) + Math.random().toString(36).substring(2)).padEnd(19, '0');
    // 判断是否重复
    const dsl = this.getCodeDsl();
    const existedIds = keys(dsl);
    if (!existedIds.includes(newId)) return newId;
    return this.getUniqueId();
  }

  public destroy() {
    this.state.isShowCodeEditor = false;
    this.state.codeDsl = null;
  }
}

export type CodeBlockService = CodeBlock;

export default new CodeBlock();
