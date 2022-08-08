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

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import type { MNode } from '@tmagic/schema';
import { NodeType } from '@tmagic/schema';

export * from './dom';

dayjs.extend(utc);

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      resolve();
    }, ms);
  });

export const datetimeFormatter = (
  v: string | Date,
  defaultValue = '-',
  format = 'YYYY-MM-DD HH:mm:ss',
): string | number => {
  if (v) {
    let time = null;
    if (['x', 'timestamp'].includes(format)) {
      time = dayjs(v).valueOf();
    } else if ((typeof v === 'string' && v.includes('Z')) || v.constructor === Date) {
      // UTC字符串时间或Date对象格式化为北京时间
      time = dayjs(v).utcOffset(8).format(format);
    } else {
      time = dayjs(v).format(format);
    }

    // 格式化为北京时间
    if (time !== 'Invalid Date') {
      return time;
    }
    return defaultValue;
  }
  return defaultValue;
};

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

export const isPage = (node: MNode | undefined): boolean => {
  if (!node) return false;
  return Boolean(node.type?.toLowerCase() === NodeType.PAGE);
};

export const isNumber = (value: string) => /^(-?\d+)(\.\d+)?$/.test(value);

export const getHost = (targetUrl: string) => targetUrl.match(/\/\/([^/]+)/)?.[1];

export const isSameDomain = (targetUrl = '', source = globalThis.location.host) => {
  const isHttpUrl = /^(http[s]?:)?\/\//.test(targetUrl);

  if (!isHttpUrl) return true;

  return getHost(targetUrl) === source;
};
