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

import { Mode } from './const';
import type { Offset } from './types';

export const getOffset = (el: HTMLElement): Offset => {
  const { transform } = getComputedStyle(el);
  const { offsetParent } = el;

  let left = el.offsetLeft;
  let top = el.offsetTop;

  if (transform.indexOf('matrix') > -1) {
    let a = 1;
    let b = 1;
    let c = 1;
    let d = 1;
    let e = 0;
    let f = 0;
    transform.replace(
      /matrix\((.+), (.+), (.+), (.+), (.+), (.+)\)/,
      ($0: string, $1: string, $2: string, $3: string, $4: string, $5: string, $6: string): string => {
        a = +$1;
        b = +$2;
        c = +$3;
        d = +$4;
        e = +$5;
        f = +$6;
        return transform;
      },
    );

    left = a * left + c * top + e;
    top = b * left + d * top + f;
  }

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

export const getHost = (targetUrl: string) => targetUrl.match(/\/\/([^/]+)/)?.[1];

export const isSameDomain = (targetUrl = '', source = globalThis.location.host) => {
  const isHttpUrl = /^(http[s]?:)?\/\//.test(targetUrl);

  if (!isHttpUrl) return true;

  return getHost(targetUrl) === source;
};

export const isAbsolute = (el?: HTMLElement): boolean => {
  if (!el) return false;
  return getComputedStyle(el).position === 'absolute';
};

export const isRelative = (el?: HTMLElement): boolean => {
  if (!el) return false;
  return getComputedStyle(el).position === 'relative';
};

export const isStatic = (el?: HTMLElement): boolean => {
  if (!el) return false;
  return getComputedStyle(el).position === 'static';
};

export const isFixed = (el?: HTMLElement): boolean => {
  if (!el) return false;
  return getComputedStyle(el).position === 'fixed';
};

export const getMode = (el: HTMLElement): Mode => {
  if (isFixed(el)) return Mode.FIXED;
  if (isStatic(el) || isRelative(el)) return Mode.SORTABLE;
  return Mode.ABSOLUTE;
};

export const getScrollParent = (element: HTMLElement, includeHidden = false): HTMLElement | null => {
  let style = getComputedStyle(element);
  const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;

  if (isFixed(element)) return null;
  for (let parent = element; parent.parentElement; ) {
    parent = parent.parentElement;
    style = getComputedStyle(parent);
    if (isAbsolute(element) && isStatic(element)) {
      continue;
    }
    if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) return parent;
  }

  return null;
};

export const createDiv = ({ className, cssText }: { className: string; cssText: string }) => {
  const el = globalThis.document.createElement('div');
  el.className = className;
  el.style.cssText = cssText;
  return el;
};
