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
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getConfig, setConfig } from '@form/utils/config';

describe('config.ts', () => {
  beforeEach(() => {
    // 重置后重新获取模块
    setConfig({});
  });

  // 在测试后都重置mock模块
  afterEach(() => {
    vi.resetModules();
  });

  test('设置获取属性', () => {
    setConfig({ text: 'form', model: { config: { text: 'test' } } });
    expect(getConfig('model')).toEqual({ config: { text: 'test' } });
  });

  test('获取不存在的属性', () => {
    expect(getConfig('model')).toBeUndefined();
    setConfig({ text: 'form', model: { config: { text: 'test' } } });
    expect(getConfig('config')).toBeUndefined();
  });

  test('修改已经存在的form', () => {
    setConfig({ text: 'form', model: { config: { text: 'test' } } });
    expect(getConfig('text')).toMatch('form');
    setConfig({ text: 'new-form', model: { config: { text: 'test' } } });
    expect(getConfig('text')).toMatch('new-form');
  });

  test('在未设置时获取Config', () => {
    expect(getConfig('model')).toBeUndefined();
  });
});
