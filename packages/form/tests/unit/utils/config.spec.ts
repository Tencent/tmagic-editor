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
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { deleteField, getConfig, getField, registerField, setConfig } from '@form/utils/config';

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

  test('registerField/getField/deleteField 完整流程', () => {
    const fakeComp: any = { name: 'fake' };
    registerField('fake-field', fakeComp);
    expect(getField('fake-field')).toBe(fakeComp);

    registerField('fake-field', { name: 'other' } as any);
    expect(getField('fake-field')).toBe(fakeComp);

    expect(deleteField('fake-field')).toBe(true);
    expect(getField('fake-field')).toBeUndefined();
    expect(deleteField('fake-field')).toBe(false);
  });
});
