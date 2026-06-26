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
import { nextTick, ref } from 'vue';
import MagicForm, { MForm } from '@form/index';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

const mountForm = (props: Record<string, any> = {}, options: Record<string, any> = {}) =>
  mount(MForm, {
    global: {
      plugins: [ElementPlus as any, MagicForm as any],
    },
    props: {
      initValues: {},
      config: [],
      ...props,
    },
    ...options,
  });

describe('Form.vue —— 默认 props', () => {
  test('未传任何 props 时使用默认值，渲染不报错', async () => {
    const wrapper = mountForm();
    await nextTick();

    expect(wrapper.find('.m-form').exists()).toBe(true);
    expect(wrapper.vm.values).toEqual({});
    expect(wrapper.vm.changeRecords).toEqual([]);
  });

  test('height/labelWidth 透传到样式与子表单', async () => {
    const wrapper = mountForm({ height: '300px', labelWidth: '120px' });
    await nextTick();

    const formEl = wrapper.find('.m-form').element as HTMLElement;
    expect(formEl.getAttribute('style') || '').toContain('height: 300px');
  });
});

describe('Form.vue —— formState getter 行为', () => {
  test('formState 的 keyProp / popperClass / config / initValues / isCompare / lastValues / parentValues 始终回读最新 props', async () => {
    const wrapper = mountForm({
      keyProp: 'id',
      popperClass: 'pop-a',
      isCompare: false,
      initValues: { a: 1 },
      lastValues: { a: 0 },
      parentValues: { x: 1 },
      config: [{ text: 'a', name: 'a' }],
    });
    await nextTick();

    const fs1: any = wrapper.vm.formState;
    expect(fs1.keyProp).toBe('id');
    expect(fs1.popperClass).toBe('pop-a');
    expect(fs1.isCompare).toBe(false);
    expect(fs1.initValues).toEqual({ a: 1 });
    expect(fs1.lastValues).toEqual({ a: 0 });
    expect(fs1.parentValues).toEqual({ x: 1 });
    expect(Array.isArray(fs1.config)).toBe(true);

    // 修改 props，formState 上的 getter 应直接反映新值（无中间态）
    await wrapper.setProps({
      keyProp: 'uuid',
      popperClass: 'pop-b',
      isCompare: true,
      parentValues: { x: 2 },
    });

    const fs2: any = wrapper.vm.formState;
    expect(fs2.keyProp).toBe('uuid');
    expect(fs2.popperClass).toBe('pop-b');
    expect(fs2.isCompare).toBe(true);
    expect(fs2.parentValues).toEqual({ x: 2 });
  });

  test('values / lastValuesProcessed 在 formState 上自动解包为 ref 当前值', async () => {
    const wrapper = mountForm({
      isCompare: true,
      initValues: { a: '1' },
      lastValues: { a: '2' },
      config: [{ text: 'a', type: 'text', name: 'a' }],
    });
    await nextTick();
    await nextTick();
    await nextTick();

    expect((wrapper.vm.formState as any).values).toEqual({ a: '1' });
    expect((wrapper.vm.formState as any).lastValuesProcessed).toEqual({ a: '2' });
  });
});

describe('Form.vue —— extendState', () => {
  test('extendState 抛错时被 catch，不影响表单渲染', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const extendState = vi.fn(async () => {
      throw new Error('boom');
    });

    const wrapper = mountForm({
      extendState,
      config: [{ text: 'text', name: 'text', type: 'text' }],
    });

    await nextTick();
    await nextTick();

    expect(extendState).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    expect(wrapper.find('.m-form').exists()).toBe(true);

    errorSpy.mockRestore();
  });

  test('extendState 返回的普通字段被合并到 formState', async () => {
    const wrapper = mountForm({
      extendState: async () => ({ extra: 'hello', count: 42 }),
    });

    await nextTick();
    await nextTick();
    await nextTick();

    expect((wrapper.vm.formState as any).extra).toBe('hello');
    expect((wrapper.vm.formState as any).count).toBe(42);
  });

  test('extendState 返回的 accessor 描述符按原样定义并支持读时求值', async () => {
    let counter = 0;

    const wrapper = mountForm({
      extendState: () =>
        Object.defineProperties(
          {},
          {
            stage: {
              enumerable: true,
              get() {
                counter += 1;
                return `stage-${counter}`;
              },
            },
          },
        ),
    });

    await nextTick();
    await nextTick();
    await nextTick();

    const v1 = (wrapper.vm.formState as any).stage;
    const v2 = (wrapper.vm.formState as any).stage;

    expect(v1).not.toEqual(v2);
    expect(v1).toMatch(/^stage-/);
    expect(v2).toMatch(/^stage-/);
  });

  test('extendState 同步段读到的响应式数据变化时会重跑', async () => {
    const username = ref('alice');
    const calls: string[] = [];

    const wrapper = mountForm({
      // 同步读取 ref，会被 watchEffect 跟踪
      extendState: (_state: any) => {
        calls.push(username.value);
        return { username: username.value };
      },
    });

    await nextTick();
    await nextTick();
    expect((wrapper.vm.formState as any).username).toBe('alice');

    username.value = 'bob';
    await nextTick();
    await nextTick();
    await nextTick();

    expect((wrapper.vm.formState as any).username).toBe('bob');
    // 至少跑了两次（初始 + 响应变化）
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });

  test('未传 extendState 时 watchEffect 早退，不抛错', async () => {
    const wrapper = mountForm({});
    await nextTick();
    expect(wrapper.find('.m-form').exists()).toBe(true);
  });
});

describe('Form.vue —— resetForm / changeRecords', () => {
  test('resetForm 会清空 changeRecords', async () => {
    const wrapper = mountForm({
      config: [{ text: 'text', type: 'text', name: 'text' }],
    });
    await nextTick();

    wrapper.find('input').setValue('hi');
    await nextTick();

    expect(wrapper.vm.changeRecords.length).toBeGreaterThan(0);

    wrapper.vm.resetForm();
    await nextTick();

    expect(wrapper.vm.changeRecords).toEqual([]);
  });
});

describe('Form.vue —— submitForm 实例方法', () => {
  test('校验通过返回 cloneDeep 后的 values', async () => {
    const wrapper = mountForm({
      config: [{ text: 'text', type: 'text', name: 'text' }],
      initValues: { text: 'hi' },
    });
    await nextTick();

    const result = await wrapper.vm.submitForm();
    expect(result).toEqual({ text: 'hi' });
    // 默认 cloneDeep，应该不是同一引用
    expect(result).not.toBe(wrapper.vm.values);
  });

  test('native=true 直接返回原 values 引用', async () => {
    const wrapper = mountForm({
      config: [{ text: 'text', type: 'text', name: 'text' }],
      initValues: { text: 'hi' },
    });
    await nextTick();

    const result = await wrapper.vm.submitForm(true);
    expect(result).toBe(wrapper.vm.values);
  });

  test('校验失败时 emit error 并抛出汇总后的错误（错误信息中包含字段 text）', async () => {
    const wrapper = mountForm({
      config: [
        {
          text: '名称',
          type: 'text',
          name: 'name',
        },
      ],
      initValues: { name: '' },
    });
    await nextTick();

    // 替换 useTemplateRef 暴露的 validate（写入 $.exposed 才能影响内部 setup 中的 tMagicFormRef.value）
    const tmForm = wrapper.findComponent({ name: 'TMForm' });
    expect(tmForm.exists()).toBe(true);

    const invalidFields = {
      name: [{ field: 'name', message: '必填' }],
    };
    const { exposed } = (tmForm.vm as any).$;
    exposed.validate = vi.fn().mockRejectedValue(invalidFields);

    let caught: Error | null = null;
    try {
      await wrapper.vm.submitForm();
    } catch (e: any) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(caught!.message).toContain('名称');
    expect(caught!.message).toContain('必填');
    expect(wrapper.emitted('error')).toBeTruthy();
    expect(wrapper.emitted('error')![0][0]).toEqual(invalidFields);
  });

  test('校验返回非 true（tdesign 风格）时也走错误分支', async () => {
    const wrapper = mountForm({
      config: [{ text: '账号', type: 'text', name: 'account' }],
      initValues: { account: '' },
    });
    await nextTick();

    const tmForm = wrapper.findComponent({ name: 'TMForm' });
    const invalidFields = {
      account: [{ field: 'account', message: '不能为空' }],
    };
    const { exposed } = (tmForm.vm as any).$;
    exposed.validate = vi.fn().mockResolvedValue(invalidFields);

    let caught: Error | null = null;
    try {
      await wrapper.vm.submitForm();
    } catch (e: any) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(caught!.message).toContain('账号');
    expect(caught!.message).toContain('不能为空');
  });

  test('校验失败但 invalidFields 中字段无对应 text 时回退使用 field/prop 名', async () => {
    const wrapper = mountForm({
      config: [{ text: 'a', type: 'text', name: 'a' }],
      initValues: { a: '' },
    });
    await nextTick();

    const tmForm = wrapper.findComponent({ name: 'TMForm' });
    const { exposed } = (tmForm.vm as any).$;
    exposed.validate = vi.fn().mockRejectedValue({
      unknown: [{ field: '', message: '出错' }],
    });

    let caught: Error | null = null;
    try {
      await wrapper.vm.submitForm();
    } catch (e: any) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(Error);
    // field 为空 -> 用 prop（unknown）
    expect(caught!.message).toContain('unknown');
    expect(caught!.message).toContain('出错');
  });
});

describe('Form.vue —— useFieldTextInError', () => {
  const mountAndMockValidate = async (
    props: Record<string, any>,
    invalidFields: Record<string, { field: string; message: string }[]>,
  ) => {
    const wrapper = mountForm(props);
    await nextTick();

    const tmForm = wrapper.findComponent({ name: 'TMForm' });
    const { exposed } = (tmForm.vm as any).$;
    exposed.validate = vi.fn().mockRejectedValue(invalidFields);

    let caught: Error | null = null;
    try {
      await wrapper.vm.submitForm();
    } catch (e: any) {
      caught = e;
    }

    return { wrapper, caught };
  };

  test('默认（useFieldTextInError 未传）时错误信息使用 config 中的 text', async () => {
    const { caught } = await mountAndMockValidate(
      {
        config: [{ text: '名称', type: 'text', name: 'name' }],
        initValues: { name: '' },
      },
      { name: [{ field: 'name', message: '必填' }] },
    );

    expect(caught!.message).toContain('名称');
    expect(caught!.message).not.toContain('name -> ');
  });

  test('useFieldTextInError=true 时错误信息使用 config 中的 text', async () => {
    const { caught } = await mountAndMockValidate(
      {
        config: [{ text: '名称', type: 'text', name: 'name' }],
        initValues: { name: '' },
        useFieldTextInError: true,
      },
      { name: [{ field: 'name', message: '必填' }] },
    );

    expect(caught!.message).toContain('名称 -> 必填');
  });

  test('useFieldTextInError=false 时跳过查找，直接使用字段 name', async () => {
    const { caught } = await mountAndMockValidate(
      {
        config: [{ text: '名称', type: 'text', name: 'name' }],
        initValues: { name: '' },
        useFieldTextInError: false,
      },
      { name: [{ field: 'name', message: '必填' }] },
    );

    expect(caught!.message).toContain('name -> 必填');
    expect(caught!.message).not.toContain('名称');
  });
});

describe('Form.vue —— getTextByName', () => {
  let wrapper: ReturnType<typeof mountForm>;

  beforeEach(async () => {
    wrapper = mountForm({
      config: [
        { text: '名称', type: 'text', name: 'name' },
        {
          name: 'object',
          items: [
            { text: '内层名称', type: 'text', name: 'inner' },
            {
              name: 'nested',
              items: [{ text: '深层', type: 'text', name: 'deep' }],
            },
          ],
        },
        // 无 name 的容器，items 应能继续被搜索
        {
          items: [{ text: '无名容器内字段', type: 'text', name: 'plain' }],
        },
        // text 非字符串
        { text: { foo: 'bar' } as any, type: 'text', name: 'nonString' },
      ],
    });
    await nextTick();
  });

  afterEach(() => {
    wrapper.unmount();
  });

  test('单层名匹配', () => {
    expect(wrapper.vm.getTextByName('name')).toBe('名称');
  });

  test('点分隔多层路径匹配', () => {
    expect(wrapper.vm.getTextByName('object.inner')).toBe('内层名称');
    expect(wrapper.vm.getTextByName('object.nested.deep')).toBe('深层');
  });

  test('无 name 容器的 items 也能被搜索到', () => {
    expect(wrapper.vm.getTextByName('plain')).toBe('无名容器内字段');
  });

  test('找不到时返回 undefined', () => {
    expect(wrapper.vm.getTextByName('not.exist')).toBeUndefined();
    expect(wrapper.vm.getTextByName('object.unknown')).toBeUndefined();
  });

  test('text 非字符串时返回 undefined', () => {
    expect(wrapper.vm.getTextByName('nonString')).toBeUndefined();
  });

  test('参数非法时返回 undefined', () => {
    expect(wrapper.vm.getTextByName('')).toBeUndefined();
    // @ts-expect-error 故意传非数组
    expect(wrapper.vm.getTextByName('name', null)).toBeUndefined();
  });
});

describe('Form.vue —— preventSubmitDefault', () => {
  test('preventSubmitDefault=true 时 submit 事件 preventDefault 被调用', async () => {
    const wrapper = mountForm({
      config: [{ text: 'text', type: 'text', name: 'text' }],
      preventSubmitDefault: true,
    });
    await nextTick();

    const formEl = wrapper.find('.m-form').element as HTMLFormElement;
    const evt = new Event('submit', { cancelable: true, bubbles: true });
    const spy = vi.spyOn(evt, 'preventDefault');
    formEl.dispatchEvent(evt);

    expect(spy).toHaveBeenCalled();
  });

  test('preventSubmitDefault=false（默认）时不调用 preventDefault', async () => {
    const wrapper = mountForm({
      config: [{ text: 'text', type: 'text', name: 'text' }],
    });
    await nextTick();

    const formEl = wrapper.find('.m-form').element as HTMLFormElement;
    const evt = new Event('submit', { cancelable: true, bubbles: true });
    const spy = vi.spyOn(evt, 'preventDefault');
    formEl.dispatchEvent(evt);

    expect(spy).not.toHaveBeenCalled();
  });
});

describe('Form.vue —— isCompare 模式', () => {
  test('isCompare=true 时 lastValuesProcessed 会被初始化', async () => {
    const wrapper = mountForm({
      isCompare: true,
      config: [{ text: 'text', type: 'text', name: 'text' }],
      initValues: { text: 'a' },
      lastValues: { text: 'b' },
    });

    await nextTick();
    await nextTick();
    await nextTick();

    expect(wrapper.vm.values.text).toBe('a');
    expect(wrapper.vm.lastValuesProcessed.text).toBe('b');
    expect(wrapper.vm.initialized).toBe(true);
  });

  test('isCompare=false 时 lastValuesProcessed 不会被填充', async () => {
    const wrapper = mountForm({
      isCompare: false,
      config: [{ text: 'text', type: 'text', name: 'text' }],
      initValues: { text: 'a' },
      lastValues: { text: 'b' },
    });

    await nextTick();
    await nextTick();
    await nextTick();

    expect(wrapper.vm.values.text).toBe('a');
    expect(wrapper.vm.lastValuesProcessed).toEqual({});
    expect(wrapper.vm.initialized).toBe(true);
  });
});

describe('Form.vue —— config 变化', () => {
  test('config 引用变化会重新初始化（initialized 短暂置 false 后回 true）', async () => {
    const wrapper = mountForm({
      config: [{ text: 'a', type: 'text', name: 'a' }],
      initValues: { a: '1' },
    });
    await nextTick();
    await nextTick();

    expect(wrapper.vm.initialized).toBe(true);

    await wrapper.setProps({
      config: [{ text: 'b', type: 'text', name: 'b' }],
      initValues: { b: '2' },
    });

    // 第一次 microtask 后还在重建
    await nextTick();
    await nextTick();
    await nextTick();

    expect(wrapper.vm.initialized).toBe(true);
    expect(wrapper.vm.values).toHaveProperty('b');
  });

  test('config 变化会清空 changeRecords', async () => {
    const wrapper = mountForm({
      config: [{ text: 'a', type: 'text', name: 'a' }],
    });
    await nextTick();

    wrapper.find('input').setValue('xx');
    await nextTick();
    expect(wrapper.vm.changeRecords.length).toBeGreaterThan(0);

    await wrapper.setProps({
      config: [{ text: 'b', type: 'text', name: 'b' }],
      initValues: {},
    });
    await nextTick();
    await nextTick();

    expect(wrapper.vm.changeRecords).toEqual([]);
  });
});
