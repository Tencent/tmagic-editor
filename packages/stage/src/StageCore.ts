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

import { GuidesEvents } from '@scena/guides';

import { Id } from '@tmagic/schema';

import { DEFAULT_ZOOM } from './const';
import StageDragResize from './StageDragResize';
import StageMask from './StageMask';
import StageRender from './StageRender';
import { RemoveData, Runtime, SortEventData, StageCoreConfig, UpdateData, UpdateEventData } from './types';
import { isFixed } from './util';

export default class StageCore extends EventEmitter {
  public selectedDom: Element | undefined;

  public renderer: StageRender;
  public mask: StageMask;
  public dr: StageDragResize;
  public config: StageCoreConfig;
  public zoom = DEFAULT_ZOOM;

  constructor(config: StageCoreConfig) {
    super();

    this.config = config;

    this.setZoom(config.zoom);

    this.renderer = new StageRender({ core: this });
    this.mask = new StageMask({ core: this });
    this.dr = new StageDragResize({ core: this, container: this.mask.content });

    this.renderer.on('runtime-ready', (runtime: Runtime) => this.emit('runtime-ready', runtime));
    this.renderer.on('page-el-update', (el: HTMLElement) => this.mask?.observe(el));

    this.mask.on('select', async (el: Element) => {
      await this.dr?.select(el as HTMLElement);
    });
    this.mask.on('selected', (el: Element) => {
      this.select(el as HTMLElement);
      this.emit('select', el);
    });

    this.dr.on('update', (data: UpdateEventData) => this.emit('update', data));
    this.dr.on('sort', (data: UpdateEventData) => this.emit('sort', data));
  }

  /**
   * 选中组件
   * @param idOrEl 组件Dom节点的id属性，或者Dom节点
   */
  public async select(idOrEl: Id | HTMLElement): Promise<void> {
    let el;
    if (typeof idOrEl === 'string' || typeof idOrEl === 'number') {
      const runtime = await this.renderer?.getRuntime();
      el = await runtime?.select?.(`${idOrEl}`);
      if (!el) throw new Error(`不存在ID为${idOrEl}的元素`);
    } else {
      el = idOrEl;
    }

    if (this.selectedDom === el) return;

    await this.beforeSelect(el);

    this.selectedDom = el;
    this.setMaskLayout(el);
    this.dr?.select(el);
  }

  public update(data: UpdateData): void {
    const { config } = data;

    this.renderer?.getRuntime().then((runtime) => {
      runtime?.update?.(data);
      // 更新配置后，需要等组件渲染更新
      setTimeout(() => {
        const el = this.renderer.contentWindow?.document.getElementById(`${config.id}`);
        if (el) {
          // 更新了组件的布局，需要重新设置mask是否可以滚动
          this.setMaskLayout(el);
        }
        this.dr?.refresh();
      }, 0);
    });
  }

  public sortNode(data: SortEventData): void {
    this.renderer?.getRuntime().then((runtime) => runtime?.sortNode?.(data));
  }

  public add(data: UpdateData): void {
    this.renderer?.getRuntime().then((runtime) => runtime?.add?.(data));
  }

  public remove(data: RemoveData): void {
    this.renderer?.getRuntime().then((runtime) => runtime?.remove?.(data));
  }

  public setZoom(zoom: number = DEFAULT_ZOOM): void {
    this.zoom = zoom;
  }

  /**
   * 挂载Dom节点
   * @param el 将stage挂载到该Dom节点上
   */
  public mount(el: HTMLDivElement): void {
    const { mask, renderer } = this;

    renderer.mount(el);
    mask.mount(el);

    const { wrapper: maskWrapper, hGuides, vGuides } = mask;

    maskWrapper.addEventListener('scroll', this.maskScrollHandler);
    hGuides.on('changeGuides', this.hGuidesChangeGuidesHandler);
    vGuides.on('changeGuides', this.vGuidesChangeGuidesHandler);

    this.emit('mounted');
  }

  /**
   * 清空所有参考线
   */
  public clearGuides() {
    this.mask.clearGuides();
    this.dr.setHGuidelines([]);
    this.dr.setVGuidelines([]);
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    const { mask, renderer, dr } = this;
    const { wrapper: maskWrapper, hGuides, vGuides } = mask;

    renderer.destroy();
    mask.destroy();
    dr.destroy();
    maskWrapper.removeEventListener('scroll', this.maskScrollHandler);
    hGuides.off('changeGuides', this.hGuidesChangeGuidesHandler);
    vGuides.off('changeGuides', this.vGuidesChangeGuidesHandler);
    this.removeAllListeners();
  }

  private maskScrollHandler = (event: Event) => {
    const { mask, renderer } = this;
    const { wrapper: maskWrapper, hGuides, vGuides } = mask;
    const { scrollTop } = maskWrapper;

    renderer?.contentWindow?.document.documentElement.scrollTo({ top: scrollTop });

    hGuides.scrollGuides(scrollTop);
    hGuides.scroll(0);

    vGuides.scrollGuides(0);
    vGuides.scroll(scrollTop);

    this.emit('scroll', event);
  };

  private hGuidesChangeGuidesHandler = (e: GuidesEvents['changeGuides']) => {
    this.dr.setHGuidelines(e.guides);
    this.emit('changeGuides');
  };

  private vGuidesChangeGuidesHandler = (e: GuidesEvents['changeGuides']) => {
    this.dr.setVGuidelines(e.guides);
    this.emit('changeGuides');
  };

  private setMaskLayout(el: HTMLElement): void {
    let fixed = false;
    let dom = el;
    while (dom) {
      fixed = isFixed(dom);
      if (fixed) {
        break;
      }
      const { parentElement } = dom;
      if (!parentElement || parentElement.tagName === 'BODY') {
        break;
      }
      dom = parentElement;
    }

    if (fixed) {
      this.mask?.setFixed();
    } else {
      this.mask?.setAbsolute();
    }
  }

  private async beforeSelect(el: HTMLElement): Promise<void> {
    const runtime = await this.renderer?.getRuntime();
    if (runtime?.beforeSelect) {
      await runtime.beforeSelect(el);
    }
  }
}
