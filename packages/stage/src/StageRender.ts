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

import { EventEmitter } from 'events';

import { getHost, injectStyle, isSameDomain } from '@tmagic/utils';

import StageCore from './StageCore';
import style from './style.css?raw';
import type { Runtime, RuntimeWindow, StageRenderConfig } from './types';

export default class StageRender extends EventEmitter {
  /** 组件的js、css执行的环境，直接渲染为当前window，iframe渲染则为iframe.contentWindow */
  public contentWindow: RuntimeWindow | null = null;

  public runtime: Runtime | null = null;

  public iframe?: HTMLIFrameElement;

  public runtimeUrl?: string;

  public core: StageCore;

  private render?: (renderer: StageCore) => Promise<HTMLElement> | HTMLElement;

  constructor({ core }: StageRenderConfig) {
    super();

    this.core = core;
    this.runtimeUrl = core.config.runtimeUrl || '';
    this.render = core.config.render;

    this.iframe = globalThis.document.createElement('iframe');
    // 同源，直接加载
    this.iframe.src = isSameDomain(this.runtimeUrl) ? this.runtimeUrl : '';
    this.iframe.style.cssText = `
      border: 0;
      width: 100%;
      height: 100%;
    `;

    this.iframe.addEventListener('load', this.loadHandler);
  }

  public getMagicApi = () => ({
    onPageElUpdate: (el: HTMLElement) => this.emit('page-el-update', el),
    onRuntimeReady: (runtime: Runtime) => {
      this.runtime = runtime;
      // @ts-ignore
      globalThis.runtime = runtime;
      this.emit('runtime-ready', runtime);
    },
  });

  /**
   * 挂载Dom节点
   * @param el 将页面挂载到该Dom节点上
   */
  public async mount(el: HTMLDivElement) {
    if (!this.iframe) {
      throw Error('mount 失败');
    }

    if (!isSameDomain(this.runtimeUrl) && this.runtimeUrl) {
      // 不同域，使用srcdoc发起异步请求，需要目标地址支持跨域
      let html = await fetch(this.runtimeUrl).then((res) => res.text());
      // 使用base, 解决相对路径或绝对路径的问题
      const base = `${location.protocol}//${getHost(this.runtimeUrl)}`;
      html = html.replace('<head>', `<head>\n<base href="${base}">`);
      this.iframe.srcdoc = html;
    }

    el.appendChild<HTMLIFrameElement>(this.iframe);

    this.postTmagicRuntimeReady();
  }

  public getRuntime = (): Promise<Runtime> => {
    if (this.runtime) return Promise.resolve(this.runtime);
    return new Promise((resolve) => {
      const listener = (runtime: Runtime) => {
        this.off('runtime-ready', listener);
        resolve(runtime);
      };
      this.on('runtime-ready', listener);
    });
  };

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.iframe?.removeEventListener('load', this.loadHandler);
    this.contentWindow = null;
    this.iframe?.remove();
    this.iframe = undefined;
    this.removeAllListeners();
  }

  private loadHandler = async () => {
    if (!this.contentWindow?.magic) {
      this.postTmagicRuntimeReady();
    }

    if (!this.contentWindow) return;

    if (this.render) {
      const el = await this.render(this.core);
      if (el) {
        this.contentWindow.document?.body?.appendChild(el);
      }
    }

    this.emit('onload');

    injectStyle(this.contentWindow.document, style);
  };

  private postTmagicRuntimeReady() {
    this.contentWindow = this.iframe?.contentWindow as RuntimeWindow;

    this.contentWindow.magic = this.getMagicApi();

    this.contentWindow.postMessage(
      {
        tmagicRuntimeReady: true,
      },
      '*',
    );
  }
}
