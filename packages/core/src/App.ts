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

import { Id, MApp } from '@tmagic/schema';

import Env from './Env';
import {
  bindCommonEventListener,
  DEFAULT_EVENTS,
  getCommonEventName,
  isCommonMethod,
  triggerCommonMethod,
} from './events';
import Page from './Page';
import { fillBackgroundImage, style2Obj } from './utils';

interface AppOptionsConfig {
  ua?: string;
  config?: MApp;
  platform?: 'editor' | 'mobile' | 'tv' | 'pc';
  jsEngine?: 'browser' | 'hippy';
  curPage?: Id;
  transformStyle?: (style: Record<string, any>) => Record<string, any>;
}

class App extends EventEmitter {
  env;

  pages = new Map<Id, Page>();

  page: Page | undefined;

  platform = 'mobile';
  jsEngine = 'browser';

  components = new Map();

  constructor(options: AppOptionsConfig) {
    super();

    this.env = new Env(options.ua);
    options.platform && (this.platform = options.platform);
    options.jsEngine && (this.jsEngine = options.jsEngine);

    // 根据屏幕大小计算出跟节点的font-size，用于rem样式的适配
    if (this.platform === 'mobile' || this.platform === 'editor') {
      const calcFontsize = () => {
        let { width } = document.documentElement.getBoundingClientRect();
        width = Math.min(800, width);
        const fontSize = width / 3.75;
        document.documentElement.style.fontSize = `${fontSize}px`;
      };

      calcFontsize();

      document.body.style.fontSize = '14px';

      globalThis.addEventListener('resize', calcFontsize);
    }

    if (options.transformStyle) {
      this.transformStyle = options.transformStyle;
    }

    options.config && this.setConfig(options.config, options.curPage);

    bindCommonEventListener(this);
  }

  /**
   * 将dsl中的style配置转换成css，主要是将数子转成rem为单位的样式值，例如100将被转换成1rem
   * @param style Object
   * @returns Object
   */
  transformStyle(style: Record<string, any> | string) {
    if (!style) {
      return {};
    }

    let styleObj: Record<string, any> = {};
    const results: Record<string, any> = {};

    if (typeof style === 'string') {
      styleObj = style2Obj(style);
    } else {
      styleObj = { ...style };
    }

    const whiteList = ['zIndex', 'opacity', 'fontWeight'];
    Object.entries(styleObj).forEach(([key, value]) => {
      if (key === 'backgroundImage') {
        value && (results[key] = fillBackgroundImage(value));
      } else if (key === 'transform' && typeof value !== 'string') {
        results[key] = Object.entries(value as Record<string, string>)
          .map(([transformKey, transformValue]) => {
            let defaultValue = 0;
            if (transformKey === 'scale') {
              defaultValue = 1;
            }
            return `${transformKey}(${transformValue || defaultValue})`;
          })
          .join(' ');
      } else if (!whiteList.includes(key) && value && /^[-]?[0-9]*[.]?[0-9]*$/.test(value)) {
        results[key] = `${value / 100}rem`;
      } else {
        results[key] = value;
      }
    });

    return results;
  }

  /**
   * 设置dsl
   * @param config dsl跟节点
   * @param curPage 当前页面id
   */
  setConfig(config: MApp, curPage?: Id) {
    this.pages = new Map();

    config.items?.forEach((page) => {
      this.pages.set(
        page.id,
        new Page({
          config: page,
        }),
      );
    });

    this.setPage(curPage || this.page?.data?.id);
  }

  setPage(id?: Id) {
    let page;

    if (id) {
      page = this.pages.get(id);
    }

    if (!page) {
      page = this.pages.get(this.pages.keys().next().value);
    }

    this.page = page;

    if (this.platform !== 'magic') {
      this.bindEvents();
    }
  }

  registerComponent(type: string, Component: any) {
    this.components.set(type, Component);
  }

  unregisterComponent(type: string) {
    this.components.delete(type);
  }

  resolveComponent(type: string) {
    return this.components.get(type);
  }

  bindEvents() {
    if (!this.page) return;

    this.removeAllListeners();

    for (const [, value] of this.page.nodes) {
      value.events?.forEach((event) => {
        let { name: eventName } = event;
        if (DEFAULT_EVENTS.findIndex((defaultEvent) => defaultEvent.value === eventName) > -1) {
          // common 事件名通过 node id 避免重复触发
          eventName = getCommonEventName(eventName, `${value.data.id}`);
        }

        this.on(eventName, (fromCpt, ...args) => {
          if (!this.page) throw new Error('当前没有页面');

          const toNode = this.page.getNode(event.to);
          if (!toNode) throw `ID为${event.to}的组件不存在`;

          const { method: methodName } = event;
          if (isCommonMethod(methodName)) {
            return triggerCommonMethod(methodName, toNode);
          }

          if (typeof toNode.instance?.[methodName] === 'function') {
            toNode.instance[methodName](fromCpt, ...args);
          }
        });
      });
    }
  }

  destroy() {
    this.removeAllListeners();
    this.pages.clear();
  }
}

export default App;
