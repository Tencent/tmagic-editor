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

import moment from 'moment';

import { MNode } from '@tmagic/schema';

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      resolve();
    }, ms);
  });

export const datetimeFormatter = (v: string | Date, defaultValue = '-', f = 'YYYY-MM-DD HH:mm:ss') => {
  let format = f;
  if (format === 'timestamp') {
    format = 'x';
  }

  if (v) {
    let time = null;
    if ((typeof v === 'string' && v.includes('Z')) || v.constructor === Date) {
      // UTC字符串时间或Date对象格式化为北京时间
      time = moment(v).utcOffset('+08:00').format(format);
    } else {
      time = moment(v).format(format);
    }

    if (format === 'x') {
      return +time;
    }
    // 格式化为北京时间
    if (time !== 'Invalid date') {
      return time;
    }
    return defaultValue;
  }
  return defaultValue;
};

export const asyncLoadJs = (() => {
  // 正在加载或加载成功的存入此Map中
  const documentMap = new Map();

  return (url: string, crossOrigin?: string, document = globalThis.document) => {
    let loaded = documentMap.get(document);
    if (!loaded) {
      loaded = new Map();
      documentMap.set(document, loaded);
    }

    // 正在加载或已经加载成功的，直接返回
    if (loaded.get(url)) return loaded.get(url);

    const load = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      if (crossOrigin) {
        script.crossOrigin = crossOrigin;
      }
      script.src = url;
      document.body.appendChild(script);
      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        reject(new Error('加载失败'));
      };
      setTimeout(() => {
        reject(new Error('timeout'));
      }, 60 * 1000);
    }).catch((err) => {
      // 加载失败的，从map中移除，第二次加载时，可以再次执行加载
      loaded.delete(url);
      throw err;
    });

    loaded.set(url, load);
    return loaded.get(url);
  };
})();

export const asyncLoadCss = (() => {
  // 正在加载或加载成功的存入此Map中
  const documentMap = new Map();

  return (url: string, document = globalThis.document) => {
    let loaded = documentMap.get(document);
    if (!loaded) {
      loaded = new Map();
      documentMap.set(document, loaded);
    }

    // 正在加载或已经加载成功的，直接返回
    if (loaded.get(url)) return loaded.get(url);

    const load = new Promise<void>((resolve, reject) => {
      const node = document.createElement('link');
      node.rel = 'stylesheet';
      node.href = url;
      document.head.appendChild(node);
      node.onload = () => {
        resolve();
      };
      node.onerror = () => {
        reject(new Error('加载失败'));
      };
      setTimeout(() => {
        reject(new Error('timeout'));
      }, 60 * 1000);
    }).catch((err) => {
      // 加载失败的，从map中移除，第二次加载时，可以再次执行加载
      loaded.delete(url);
      throw err;
    });

    loaded.set(url, load);
    return loaded.get(url);
  };
})();

// 驼峰转换横线
export const toLine = (name = '') => name.replace(/\B([A-Z])/g, '-$1').toLowerCase();

export const toHump = (name = ''): string => name.replace(/-(\w)/g, (all, letter) => letter.toUpperCase());

export const emptyFn = (): any => undefined;

/**
 * 通过id获取组件在应用的子孙路径
 * @param {number | string} id 组件id
 * @param {Array} data 要查找的根容器节点
 * @return {Array} 组件在data中的子孙路径
 */
export const getNodePath = (id: number | string, data: MNode[] = []): MNode[] => {
  const path: MNode[] = [];

  const get = function (id: number | string, data: MNode[]): MNode | null {
    if (!Array.isArray(data)) {
      return null;
    }

    for (let i = 0, l = data.length; i < l; i++) {
      const item: any = data[i];

      path.push(item);
      if (`${item.id}` === `${id}`) {
        return item;
      }

      if (item.items) {
        const node = get(id, item.items);
        if (node) {
          return node;
        }
      }

      path.pop();
    }

    return null;
  };

  get(id, data);

  return path;
};

export const filterXSS = (str: string) =>
  str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const getUrlParam = (param: string, url?: string) => {
  const u = url || location.href;
  const reg = new RegExp(`[?&#]${param}=([^&#]+)`, 'gi');

  const matches = u.match(reg);
  let strArr;
  if (matches && matches.length > 0) {
    strArr = matches[matches.length - 1].split('=');
    if (strArr && strArr.length > 1) {
      // 过滤XSS字符
      return filterXSS(strArr[1]);
    }
    return '';
  }
  return '';
};

export const isPop = (node: MNode): boolean => Boolean(node.type?.toLowerCase().endsWith('pop'));
