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

import type { CodeBlockContent, CodeBlockDSL, CodeState } from '../type';
import { info } from '../utils/logger';

import BaseService from './BaseService';

class CodeBlock extends BaseService {
  private state = reactive<CodeState>({
    isShowCodeEditor: false,
    codeDsl: null,
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
  public getCodeDslById(id: string): CodeBlockContent | null {
    const totalCodeDsl = this.getCodeDsl();
    if (!totalCodeDsl) return null;
    return totalCodeDsl[id] ?? null;
  }

  /**
   * 根据代码块id设置代码块内容
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
   * 生成代码块唯一id
   * @returns {string} 代码块唯一id
   */
  public getUniqueId(): string {
    return (Date.now().toString(36) + Math.random().toString(36).substring(2)).padEnd(19, '0');
  }

  public destroy() {
    this.state.isShowCodeEditor = false;
    this.state.codeDsl = null;
  }
}

export type CodeBlockService = CodeBlock;

export default new CodeBlock();
