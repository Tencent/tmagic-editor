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

import { afterEach, describe, expect, test } from 'vitest';
import { createApp, defineComponent } from 'vue';

import {
  builtInFields,
  clearFields,
  collectValidatableFields,
  getFormField,
  getTypeMatchRule,
  isLeafFieldType,
  mergeFieldOptions,
  registerBuiltInFields,
  registerField,
  registerFields,
  unregisterField,
} from '@form/index';

const FakeA = defineComponent({ name: 'FakeA', render: () => null });
const FakeB = defineComponent({ name: 'FakeB', render: () => null });

const requiredText = (name: string) => ({
  type: 'text',
  name,
  text: '内部',
  rules: [{ required: true, message: '必填' }],
});

/** 内部渲染一个名为 inner 的必填文本 */
const innerTextNested = ({ config, model, prop }: any) => ({
  config: [requiredText('inner')],
  model: model[config.name],
  prop,
});

/** 与 innerTextNested 同形，但内部字段名不同，用来区分生效的是哪一份登记 */
const renameInnerNested = ({ config, model, prop }: any) => ({
  config: [requiredText('renamed')],
  model: model[config.name],
  prop,
});

afterEach(() => {
  clearFields();
});

describe('registerField component', () => {
  test('写入字段注册表，Container 可通过 getFormField 取到组件', () => {
    registerField('my-color-picker', { component: FakeA });
    expect(getFormField('my-color-picker')).toBe(FakeA);
  });

  test('type 名支持驼峰与中划线互通', () => {
    registerField('myColorPicker', { component: FakeA });
    expect(getFormField('my-color-picker')).toBe(FakeA);
  });

  test('后一次 component 覆盖前一次', () => {
    registerField('my-field', { component: FakeA });
    registerField('my-field', { component: FakeB });
    expect(getFormField('my-field')).toBe(FakeB);
  });

  test('省略 component 时不改动已登记的 Vue 组件', () => {
    registerField('my-field', { component: FakeA });
    registerField('my-field', {
      typeMatch: () => undefined,
    });
    expect(getFormField('my-field')).toBe(FakeA);
  });

  test('unregisterField / clearFields 移除已登记的组件', () => {
    registerFields({ 'my-field': { component: FakeA } });
    unregisterField('my-field');
    expect(getFormField('my-field')).toBeUndefined();

    registerField('keep', { component: FakeB });
    clearFields();
    expect(getFormField('keep')).toBeUndefined();
  });

  test('不传 app 时不调用 app.component', () => {
    const app = createApp({});
    registerField('my-field', { component: FakeA });
    expect(getFormField('my-field')).toBe(FakeA);
    expect(app.component('m-fields-my-field')).toBeUndefined();
  });

  test('传入 app 时同步 app.component', () => {
    const app = createApp({});
    registerField('my-field', { component: FakeA }, app);
    expect(getFormField('my-field')).toBe(FakeA);
    expect(app.component('m-fields-my-field')).toBe(FakeA);
  });

  test('container 写入注册表，传入 app 时登记 m-form-*', () => {
    const app = createApp({});
    registerField('my-box', { container: FakeA }, app);
    expect(getFormField('my-box')).toBe(FakeA);
    expect(app.component('m-form-my-box')).toBe(FakeA);
    expect(app.component('m-fields-my-box')).toBeUndefined();
  });

  test('install 时内置 container 登记 m-form-*', async () => {
    const plugin = (await import('@form/plugin')).default;
    const app = createApp({});
    plugin.install(app, {});

    expect(getFormField('tab')).toBeTruthy();
    expect(app.component('m-form-tab')).toBeTruthy();
    expect(app.component('m-form-container')).toBeTruthy();
    expect(app.component('m-fields-tab')).toBeUndefined();
  });

  test('install 时 fields.component 把 app 传给 registerFields', async () => {
    const plugin = (await import('@form/plugin')).default;
    const app = createApp({});
    plugin.install(app, {
      fields: {
        'install-comp': { component: FakeA },
      },
    });

    expect(getFormField('install-comp')).toBe(FakeA);
    expect(app.component('m-fields-install-comp')).toBe(FakeA);
  });
});

describe('builtInFields', () => {
  test('不含 Vue 组件，供 Node 侧无渲染校验使用', () => {
    for (const [type, options] of Object.entries(builtInFields)) {
      expect(options.component, type).toBeUndefined();
      expect(options.container, type).toBeUndefined();
    }
  });

  test('registerBuiltInFields(builtInFields) 后 clearFields 清不掉内置叶子', () => {
    registerBuiltInFields(builtInFields);
    clearFields();
    expect(isLeafFieldType('text')).toBe(true);
    expect(isLeafFieldType('tab')).toBe(false);
  });

  test('mergeFieldOptions 把 component / container 叠到无渲染表上', () => {
    const merged = mergeFieldOptions(
      { text: {}, tab: { walk: () => undefined } },
      { text: { component: FakeA }, tab: { container: FakeB } },
    );
    expect(merged.text.component).toBe(FakeA);
    expect(merged.tab.container).toBe(FakeB);
    expect(merged.tab.walk).toEqual(expect.any(Function));
  });

  test('mergeFieldOptions 后一份只覆盖自己带的 key', () => {
    const innerConfig = () => undefined;
    const typeMatch = () => undefined;
    const merged = mergeFieldOptions(
      { 'code-select': { innerConfig, typeMatch } },
      { 'code-select': { component: FakeA } },
      { 'code-select': { component: FakeB }, 'my-field': { component: FakeA } },
    );
    expect(merged['code-select'].component).toBe(FakeB);
    expect(merged['code-select'].innerConfig).toBe(innerConfig);
    expect(merged['code-select'].typeMatch).toBe(typeMatch);
    expect(merged['my-field'].component).toBe(FakeA);
  });

  test('多次 registerField 按字段合并，typeMatch 不会丢掉 innerConfig', () => {
    registerField('my-composite', { innerConfig: innerTextNested });
    registerField('my-composite', { typeMatch: () => undefined });

    expect(getTypeMatchRule('my-composite')).toBeTypeOf('function');
    expect(
      collectValidatableFields(undefined, [{ type: 'my-composite', name: 'outer' }] as any, {
        outer: { inner: '' },
      }).map((field) => field.prop),
    ).toEqual(['outer.inner']);
  });

  test('registerBuiltInFields 的 typeMatch 不会被 clearFields 清掉', () => {
    registerBuiltInFields({
      'built-in-match': { typeMatch: () => 'built-in' },
    });
    clearFields();
    expect(getTypeMatchRule('built-in-match')).toBeTypeOf('function');
  });

  test('registerBuiltInFields 的 innerConfig 不会被 clearFields / unregisterField 清掉', () => {
    registerBuiltInFields({ 'built-in-nested': { innerConfig: innerTextNested } });

    const collect = () =>
      collectValidatableFields(undefined, [{ type: 'built-in-nested', name: 'outer' }] as any, {
        outer: { inner: '' },
      }).map((field) => field.prop);

    expect(collect()).toEqual(['outer.inner']);

    unregisterField('built-in-nested');
    expect(collect()).toEqual(['outer.inner']);

    clearFields();
    expect(collect()).toEqual(['outer.inner']);
  });

  test('业务侧 innerConfig 覆盖内置，unregisterField 后回落到内置', () => {
    registerBuiltInFields({ 'both-nested': { innerConfig: innerTextNested } });
    registerField('both-nested', { innerConfig: renameInnerNested });

    const collect = () =>
      collectValidatableFields(undefined, [{ type: 'both-nested', name: 'outer' }] as any, {
        outer: { inner: '', renamed: '' },
      }).map((field) => field.prop);

    expect(collect()).toEqual(['outer.renamed']);

    unregisterField('both-nested');
    expect(collect()).toEqual(['outer.inner']);
  });

  test('内置登记 innerConfig 不会清掉业务侧已登记的叶子', () => {
    registerField('leaf-then-built-in', {});
    expect(isLeafFieldType('leaf-then-built-in')).toBe(true);

    registerBuiltInFields({ 'leaf-then-built-in': { innerConfig: innerTextNested } });
    expect(isLeafFieldType('leaf-then-built-in')).toBe(true);
  });
});
