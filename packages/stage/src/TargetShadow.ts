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
import { guid } from '@tmagic/utils';

import { Mode, ZIndex } from './const';
import type { TargetElement as ShadowElement, TargetShadowConfig, UpdateDragEl } from './types';
import { getTargetElStyle, isFixedParent } from './util';

/**
 * 将选中的节点修正定位后，添加一个操作节点到蒙层上
 */
export default class TargetShadow {
  public el?: ShadowElement;
  public els: ShadowElement[] = [];

  private idPrefix = `target_calibrate_${guid()}`;
  private container: HTMLElement;
  private scrollLeft = 0;
  private scrollTop = 0;
  private zIndex?: ZIndex;

  private updateDragEl?: UpdateDragEl;

  constructor(config: TargetShadowConfig) {
    this.container = config.container;

    if (config.updateDragEl) {
      this.updateDragEl = config.updateDragEl;
    }

    if (typeof config.zIndex !== 'undefined') {
      this.zIndex = config.zIndex;
    }

    if (config.idPrefix) {
      this.idPrefix = `${config.idPrefix}_${guid()}`;
    }

    this.container.addEventListener('customScroll', this.scrollHandler);
  }

  public update(target: ShadowElement): ShadowElement {
    this.el = this.updateEl(target, this.el);

    return this.el;
  }

  public updateGroup(targetGroup: ShadowElement[]): ShadowElement[] {
    if (this.els.length > targetGroup.length) {
      this.els.slice(targetGroup.length - 1).forEach((el) => {
        el.remove();
      });
    }

    this.els = targetGroup.map((target, index) => this.updateEl(target, this.els[index]));

    return this.els;
  }

  public destroyEl(): void {
    this.el?.remove();
    this.el = undefined;
  }

  public destroyEls(): void {
    this.els.forEach((el) => {
      el.remove();
    });
    this.els = [];
  }

  public destroy(): void {
    this.container.removeEventListener('customScroll', this.scrollHandler);
    this.destroyEl();
    this.destroyEls();
  }

  private updateEl(target: ShadowElement, src?: ShadowElement): ShadowElement {
    const el = src || globalThis.document.createElement('div');

    el.id = `${this.idPrefix}_${target.id}`;

    el.style.cssText = getTargetElStyle(target, this.zIndex);

    if (typeof this.updateDragEl === 'function') {
      this.updateDragEl(el, target, this.container);
    }
    const isFixed = isFixedParent(target);
    const mode = this.container.dataset.mode || Mode.ABSOLUTE;
    if (isFixed && mode !== Mode.FIXED) {
      el.style.transform = `translate3d(${this.scrollLeft}px, ${this.scrollTop}px, 0)`;
    } else if (!isFixed && mode === Mode.FIXED) {
      el.style.transform = `translate3d(${-this.scrollLeft}px, ${-this.scrollTop}px, 0)`;
    }

    if (!globalThis.document.getElementById(el.id)) {
      this.container.append(el);
    }

    return el;
  }

  private scrollHandler = (e: any) => {
    this.scrollLeft = e.detail.scrollLeft;
    this.scrollTop = e.detail.scrollTop;
  };
}
