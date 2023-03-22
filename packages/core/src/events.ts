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

/**
 * 通用的事件处理
 */

import App from './App';
import Node from './Node';

export interface EventOption {
  label: string;
  value: string;
}

const COMMON_EVENT_PREFIX = 'magic:common:events:';
const COMMON_METHOD_PREFIX = 'magic:common:actions:';
const CommonMethod = {
  SHOW: 'show',
  HIDE: 'hide',
  SCROLL_TO_VIEW: 'scrollIntoView',
  SCROLL_TO_TOP: 'scrollToTop',
};

export const DEFAULT_EVENTS: EventOption[] = [{ label: '点击', value: `${COMMON_EVENT_PREFIX}click` }];

export const DEFAULT_METHODS: EventOption[] = [];

export const getCommonEventName = (commonEventName: string) => {
  if (commonEventName.startsWith(COMMON_EVENT_PREFIX)) return commonEventName;
  return `${COMMON_EVENT_PREFIX}${commonEventName}`;
};

export const isCommonMethod = (methodName: string) => methodName.startsWith(COMMON_METHOD_PREFIX);

// 点击在组件内的某个元素上，需要向上寻找到当前组件
const getDirectComponent = (element: HTMLElement | null, app: App): Node | Boolean => {
  if (!element) {
    return false;
  }

  if (!element.id) {
    return getDirectComponent(element.parentElement, app);
  }

  const node = app.page?.getNode(element.id);
  if (!node) {
    return false;
  }

  return node;
};

const commonClickEventHandler = (app: App, eventName: string, e: any) => {
  const node = getDirectComponent(e.target, app);

  if (node) {
    app.emit(getCommonEventName(eventName), node);
  }
};

export const bindCommonEventListener = (app: App) => {
  if (app.jsEngine !== 'browser') return;

  window.document.body.addEventListener('click', (e: any) => {
    commonClickEventHandler(app, 'click', e);
  });

  window.document.body.addEventListener(
    'click',
    (e: any) => {
      commonClickEventHandler(app, 'click:capture', e);
    },
    true,
  );
};

export const triggerCommonMethod = (methodName: string, node: Node) => {
  const { instance } = node;

  if (!instance) return;

  switch (methodName.replace(COMMON_METHOD_PREFIX, '')) {
    case CommonMethod.SHOW:
      instance.show();
      break;

    case CommonMethod.HIDE:
      instance.hide();
      break;

    case CommonMethod.SCROLL_TO_VIEW:
      instance.$el?.scrollIntoView({ behavior: 'smooth' });
      break;

    case CommonMethod.SCROLL_TO_TOP:
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;

    default:
      break;
  }
};
