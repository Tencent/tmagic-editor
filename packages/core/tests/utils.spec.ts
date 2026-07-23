/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
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
import { describe, expect, test } from 'vitest';

import {
  COMMON_EVENT_PREFIX,
  COMMON_METHOD_PREFIX,
  fillBackgroundImage,
  getTransform,
  style2Obj,
  transformStyle,
} from '../src/utils';

describe('style2Obj', () => {
  test('解析 css 字符串到对象，并将 kebab-case 转 camelCase', () => {
    const obj = style2Obj('background-color: red; font-size: 14px;');
    expect(obj).toEqual({ backgroundColor: 'red', fontSize: '14px' });
  });

  test('忽略空段', () => {
    const obj = style2Obj('color: red;;;font-weight: bold;');
    expect(obj).toEqual({ color: 'red', fontWeight: 'bold' });
  });

  test('支持 value 中包含冒号 (例如 url(http://...))', () => {
    const obj = style2Obj('background: url(http://example.com/a.png) no-repeat;');
    expect(obj.background).toContain('http://example.com/a.png');
  });

  test('非字符串原样返回', () => {
    const original = { color: 'red' };
    expect(style2Obj(original as any)).toBe(original);
  });
});

describe('fillBackgroundImage', () => {
  test('裸路径会包裹 url()', () => {
    expect(fillBackgroundImage('a.png')).toBe('url("a.png")');
  });

  test('已经是 url() 不重复包裹', () => {
    expect(fillBackgroundImage('url(a.png)')).toBe('url(a.png)');
  });

  test('linear-gradient 不包裹', () => {
    expect(fillBackgroundImage('linear-gradient(red, blue)')).toBe('linear-gradient(red, blue)');
  });

  test('空值原样返回', () => {
    expect(fillBackgroundImage('')).toBe('');
  });
});

describe('getTransform', () => {
  test('browser: 字符串原样返回', () => {
    expect(getTransform('rotate(90deg) scale(1.5)', 'browser')).toBe('rotate(90deg) scale(1.5)');
  });

  test('browser: 对象拼接成字符串', () => {
    expect(getTransform({ rotate: '90', scale: '1.5' }, 'browser')).toBe('rotate(90deg) scale(1.5)');
  });

  test('hippy: 字符串解析成数组', () => {
    expect(getTransform('rotate(90deg) scale(1.5)', 'hippy')).toEqual([{ rotate: '90deg' }, { scale: '1.5' }]);
  });

  test('hippy: 对象转换为数组', () => {
    expect(getTransform({ rotate: '90', scale: '1.5' }, 'hippy')).toEqual([{ rotate: '90deg' }, { scale: '1.5' }]);
  });

  test('值为空: browser 返回空字符串, hippy 返回空数组', () => {
    expect(getTransform('', 'browser')).toBe('');
    expect(getTransform('', 'hippy')).toEqual([]);
  });

  test('对象中空值会被过滤掉', () => {
    expect(getTransform({ rotate: '   ', scale: '1.5' }, 'browser')).toBe('scale(1.5)');
  });
});

describe('transformStyle', () => {
  test('空值返回空对象', () => {
    expect(transformStyle('', 'browser')).toEqual({});
    expect(transformStyle(null as any, 'browser')).toEqual({});
  });

  test('字符串入参先解析再转换', () => {
    const result = transformStyle('width: 100; color: red;', 'browser');
    expect(result.width).toBe('1rem');
    expect(result.color).toBe('red');
  });

  test('对象入参，数值转换为 rem', () => {
    expect(transformStyle({ width: 100 }, 'browser')).toEqual({ width: '1rem' });
  });

  test('白名单字段不会被转 rem', () => {
    expect(transformStyle({ zIndex: 100, opacity: 0.5, fontWeight: 700 }, 'browser')).toEqual({
      zIndex: 100,
      opacity: 0.5,
      fontWeight: 700,
    });
  });

  test('hippy 模式不转 rem 而是保留原数值', () => {
    expect(transformStyle({ width: 100 }, 'hippy')).toEqual({ width: 100 });
  });

  test('hippy: scale 单独走分支会转化为 transform 数组', () => {
    expect(transformStyle({ scale: 1.5 }, 'hippy')).toEqual({ transform: [{ scale: 1.5 }] });
  });

  test('backgroundImage: browser 下补全 url()', () => {
    expect(transformStyle({ backgroundImage: 'a.png' }, 'browser')).toEqual({
      backgroundImage: 'url("a.png")',
    });
  });

  test('transform 字段会通过 getTransform 处理', () => {
    expect(transformStyle({ transform: { rotate: '90' } }, 'browser')).toEqual({
      transform: 'rotate(90deg)',
    });
  });
});

describe('常量', () => {
  test('事件 / 方法前缀', () => {
    expect(COMMON_EVENT_PREFIX).toBe('magic:common:events:');
    expect(COMMON_METHOD_PREFIX).toBe('magic:common:actions:');
  });
});
