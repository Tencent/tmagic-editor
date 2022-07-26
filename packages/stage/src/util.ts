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
import { removeClassName } from '@tmagic/utils';

import { GHOST_EL_ID_PREFIX, Mode, SELECTED_CLASS, ZIndex } from './const';
import type { Offset, SortEventData } from './types';

const getParents = (el: Element, relative: Element) => {
  let cur: Element | null = el.parentElement;
  const parents: Element[] = [];
  while (cur && cur !== relative) {
    parents.push(cur);
    cur = cur.parentElement;
  }
  return parents;
};

export const getOffset = (el: HTMLElement): Offset => {
  const { offsetParent } = el;

  const left = el.offsetLeft;
  const top = el.offsetTop;

  if (offsetParent) {
    const parentOffset = getOffset(offsetParent as HTMLElement);
    return {
      left: left + parentOffset.left,
      top: top + parentOffset.top,
    };
  }

  return {
    left,
    top,
  };
};

// 将蒙层占位节点覆盖在原节点上方
export const getTargetElStyle = (el: HTMLElement) => {
  const offset = getOffset(el);
  const { transform } = getComputedStyle(el);
  return `
    position: absolute;
    transform: ${transform};
    left: ${offset.left}px;
    top: ${offset.top}px;
    width: ${el.clientWidth}px;
    height: ${el.clientHeight}px;
    z-index: ${ZIndex.DRAG_EL};
  `;
};

export const getAbsolutePosition = (el: HTMLElement, { top, left }: Offset) => {
  const { offsetParent } = el;

  if (offsetParent) {
    const parentOffset = getOffset(offsetParent as HTMLElement);
    return {
      left: left - parentOffset.left,
      top: top - parentOffset.top,
    };
  }

  return { left, top };
};

export const isAbsolute = (style: CSSStyleDeclaration): boolean => style.position === 'absolute';

export const isRelative = (style: CSSStyleDeclaration): boolean => style.position === 'relative';

export const isStatic = (style: CSSStyleDeclaration): boolean => style.position === 'static';

export const isFixed = (style: CSSStyleDeclaration): boolean => style.position === 'fixed';

export const isFixedParent = (el: HTMLElement) => {
  let fixed = false;
  let dom = el;
  while (dom) {
    fixed = isFixed(getComputedStyle(dom));
    if (fixed) {
      break;
    }
    const { parentElement } = dom;
    if (!parentElement || parentElement.tagName === 'BODY') {
      break;
    }
    dom = parentElement;
  }
  return fixed;
};

export const getMode = (el: HTMLElement): Mode => {
  if (isFixedParent(el)) return Mode.FIXED;
  const style = getComputedStyle(el);
  if (isStatic(style) || isRelative(style)) return Mode.SORTABLE;
  return Mode.ABSOLUTE;
};

export const getScrollParent = (element: HTMLElement, includeHidden = false): HTMLElement | null => {
  let style = getComputedStyle(element);
  const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;

  if (isFixed(style)) return null;

  for (let parent = element; parent.parentElement; ) {
    parent = parent.parentElement;
    style = getComputedStyle(parent);

    if (isAbsolute(style) && isStatic(style)) continue;

    if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) return parent;
  }

  return null;
};

export const removeSelectedClassName = (doc: Document) => {
  const oldEl = doc.querySelector(`.${SELECTED_CLASS}`);

  if (oldEl) {
    removeClassName(oldEl, SELECTED_CLASS);
    if (oldEl.parentNode) removeClassName(oldEl.parentNode as Element, `${SELECTED_CLASS}-parent`);
    doc.querySelectorAll(`.${SELECTED_CLASS}-parents`).forEach((item) => {
      removeClassName(item, `${SELECTED_CLASS}-parents`);
    });
  }
};

export const addSelectedClassName = (el: Element, doc: Document) => {
  el.classList.add(SELECTED_CLASS);
  (el.parentNode as Element)?.classList.add(`${SELECTED_CLASS}-parent`);
  getParents(el, doc.body).forEach((item) => {
    item.classList.add(`${SELECTED_CLASS}-parents`);
  });
};

export const calcValueByFontsize = (doc: Document, value: number) => {
  const { fontSize } = doc.documentElement.style;

  if (fontSize) {
    const times = globalThis.parseFloat(fontSize) / 100;
    return Number((value / times).toFixed(2));
  }

  return value;
};

/**
 * 下移组件位置
 * @param {number} deltaTop 偏移量
 * @param {Object} detail 当前选中的组件配置
 */
export const down = (deltaTop: number, target: HTMLElement | SVGElement): SortEventData | void => {
  let swapIndex = 0;
  let addUpH = target.clientHeight;
  const brothers = Array.from(target.parentNode?.children || []).filter(
    (node) => !node.id.startsWith(GHOST_EL_ID_PREFIX),
  );
  const index = brothers.indexOf(target);
  // 往下移动
  const downEls = brothers.slice(index + 1) as HTMLElement[];

  for (let i = 0; i < downEls.length; i++) {
    const ele = downEls[i];
    // 是 fixed 不做处理
    if (ele.style?.position === 'fixed') {
      continue;
    }
    addUpH += ele.clientHeight / 2;
    if (deltaTop <= addUpH) {
      break;
    }
    addUpH += ele.clientHeight / 2;
    swapIndex = i;
  }
  return {
    src: target.id,
    dist: downEls.length && swapIndex > -1 ? downEls[swapIndex].id : target.id,
  };
};

/**
 * 上移组件位置
 * @param {Array} brothers 处于同一容器下的所有子组件配置
 * @param {number} index 当前组件所处的位置
 * @param {number} deltaTop 偏移量
 * @param {Object} detail 当前选中的组件配置
 */
export const up = (deltaTop: number, target: HTMLElement | SVGElement): SortEventData | void => {
  const brothers = Array.from(target.parentNode?.children || []).filter(
    (node) => !node.id.startsWith(GHOST_EL_ID_PREFIX),
  );
  const index = brothers.indexOf(target);
  // 往上移动
  const upEls = brothers.slice(0, index) as HTMLElement[];

  let addUpH = target.clientHeight;
  let swapIndex = upEls.length - 1;

  for (let i = upEls.length - 1; i >= 0; i--) {
    const ele = upEls[i];
    if (!ele) continue;
    // 是 fixed 不做处理
    if (ele.style.position === 'fixed') continue;

    addUpH += ele.clientHeight / 2;
    if (-deltaTop <= addUpH) break;
    addUpH += ele.clientHeight / 2;

    swapIndex = i;
  }
  return {
    src: target.id,
    dist: upEls.length && swapIndex > -1 ? upEls[swapIndex].id : target.id,
  };
};
