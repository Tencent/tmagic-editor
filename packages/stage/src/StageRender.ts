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

import { EventEmitter } from 'events';

import { Id } from '@tmagic/schema';
import { getHost, injectStyle, isSameDomain } from '@tmagic/utils';

import { DEFAULT_ZOOM } from './const';
import style from './style.css?raw';
import {
  type Point,
  type RemoveData,
  RenderType,
  type Runtime,
  type RuntimeWindow,
  type StageRenderConfig,
  type UpdateData,
} from './types';
import { addSelectedClassName, removeSelectedClassName } from './util';

export default class StageRender extends EventEmitter {
  /** 组件的js、css执行的环境，直接渲染为当前window，iframe渲染则为iframe.contentWindow */
  public contentWindow: RuntimeWindow | null = null;
  public runtime: Runtime | null = null;
  public iframe?: HTMLIFrameElement;
  public nativeContainer?: HTMLDivElement;

  private runtimeUrl?: string;
  private zoom = DEFAULT_ZOOM;
  private renderType: RenderType;
  private customizedRender?: () => Promise<HTMLElement | null>;

  constructor({ runtimeUrl, zoom, customizedRender, renderType = RenderType.IFRAME }: StageRenderConfig) {
    super();

    this.renderType = renderType;
    this.runtimeUrl = runtimeUrl || '';
    this.customizedRender = customizedRender;
    this.setZoom(zoom);

    if (this.renderType === RenderType.IFRAME) {
      this.createIframe();
    } else if (this.renderType === RenderType.NATIVE) {
      this.createNativeContainer();
    }
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

  public async add(data: UpdateData): Promise<void> {
    const runtime = await this.getRuntime();
    return runtime?.add?.(data);
  }

  public async remove(data: RemoveData): Promise<void> {
    const runtime = await this.getRuntime();
    return runtime?.remove?.(data);
  }

  public async update(data: UpdateData): Promise<void> {
    const runtime = await this.getRuntime();
    // 更新画布中的组件
    runtime?.update?.(data);
  }

  public async select(els: HTMLElement[]): Promise<void> {
    const runtime = await this.getRuntime();

    for (const el of els) {
      await runtime?.select?.(el.id);
      if (runtime?.beforeSelect) {
        await runtime.beforeSelect(el);
      }
      this.flagSelectedEl(el);
    }
  }

  public setZoom(zoom: number = DEFAULT_ZOOM): void {
    this.zoom = zoom;
  }

  /**
   * 挂载Dom节点
   * @param el 将页面挂载到该Dom节点上
   */
  public async mount(el: HTMLDivElement) {
    if (this.iframe) {
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
    } else if (this.nativeContainer) {
      el.appendChild(this.nativeContainer);
    }
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

  public getDocument(): Document | undefined {
    return this.contentWindow?.document;
  }

  /**
   * 通过坐标获得坐标下所有HTML元素数组
   * @param point 坐标
   * @returns 坐标下方所有HTML元素数组，会包含父元素直至html，元素层叠时返回顺序是从上到下
   */
  public getElementsFromPoint(point: Point): HTMLElement[] {
    let x = point.clientX;
    let y = point.clientY;

    if (this.iframe) {
      const rect = this.iframe.getClientRects()[0];
      if (rect) {
        x = x - rect.left;
        y = y - rect.top;
      }
    }

    return this.getDocument()?.elementsFromPoint(x / this.zoom, y / this.zoom) as HTMLElement[];
  }

  public getTargetElement(idOrEl: Id | HTMLElement): HTMLElement {
    if (typeof idOrEl === 'string' || typeof idOrEl === 'number') {
      const el = this.getDocument()?.getElementById(`${idOrEl}`);
      if (!el) throw new Error(`不存在ID为${idOrEl}的元素`);
      return el;
    }
    return idOrEl;
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.iframe?.removeEventListener('load', this.iframeLoadHandler);
    this.contentWindow = null;
    this.iframe?.remove();
    this.iframe = undefined;
    this.removeAllListeners();
  }

  private createIframe(): HTMLIFrameElement {
    this.iframe = globalThis.document.createElement('iframe');
    // 同源，直接加载
    this.iframe.src = this.runtimeUrl && isSameDomain(this.runtimeUrl) ? this.runtimeUrl : '';
    this.iframe.style.cssText = `
      border: 0;
      width: 100%;
      height: 100%;
    `;

    this.iframe.addEventListener('load', this.iframeLoadHandler);

    return this.iframe;
  }

  private async createNativeContainer() {
    this.contentWindow = globalThis as unknown as RuntimeWindow;
    this.nativeContainer = globalThis.document.createElement('div');

    this.contentWindow.magic = this.getMagicApi();

    if (this.customizedRender) {
      const el = await this.customizedRender();
      if (el) {
        this.nativeContainer.appendChild(el);
      }
    }
  }

  /**
   * 在runtime中对被选中的元素进行标记，部分组件有对选中态进行特殊显示的需求
   * @param el 被选中的元素
   */
  private flagSelectedEl(el: HTMLElement): void {
    const doc = this.getDocument();
    if (doc) {
      removeSelectedClassName(doc);
      addSelectedClassName(el, doc);
    }
  }

  private iframeLoadHandler = async () => {
    if (!this.contentWindow?.magic) {
      this.postTmagicRuntimeReady();
    }

    if (!this.contentWindow) return;

    if (this.customizedRender) {
      const el = await this.customizedRender();
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
