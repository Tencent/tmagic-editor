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
import { computed, defineComponent, h, nextTick, provide, ref } from 'vue';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

import MagicForm, { FORM_CONTEXT_KEY, MForm } from '@form/index';

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

  test('labelPosition 与 labelWidth 一样，未配置时回落到表单级，配置了则用自身', async () => {
    const wrapper = mountForm({
      labelPosition: 'left',
      labelWidth: '120px',
      config: [
        { name: 'a', type: 'text', text: 'a' },
        { name: 'b', type: 'text', text: 'b', labelPosition: 'top' },
      ],
      initValues: { a: '1', b: '2' },
    });
    await nextTick();

    const containers = wrapper.findAllComponents({ name: 'MFormContainer' });
    const byName = Object.fromEntries(containers.map((c) => [c.props('config')?.name, c]));

    expect(byName.a.props('labelWidth')).toBe('120px');
    expect(byName.a.props('labelPosition')).toBe('left');
    expect(byName.b.props('labelPosition')).toBe('top');
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

  test('formState.popperClass 在传入 theme 时自动追加 m-theme 修饰类', async () => {
    const wrapper = mountForm({ popperClass: 'pop-x', theme: 'magic-admin' });
    await nextTick();

    const fs: any = wrapper.vm.formState;
    expect(fs.popperClass).toBe('pop-x m-theme--magic-admin');

    // 仅 theme 没有用户 popperClass 时不带前导空格
    await wrapper.setProps({ popperClass: undefined });
    expect(wrapper.vm.formState.popperClass).toBe('m-theme--magic-admin');

    // 取消 theme 后回退为原始 popperClass
    await wrapper.setProps({ theme: undefined, popperClass: 'pop-x' });
    expect(wrapper.vm.formState.popperClass).toBe('pop-x');
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

describe('Form.vue —— context', () => {
  test('context 字段可通过 formState 读穿，核心字段不被覆盖', async () => {
    const wrapper = mountForm({
      keyProp: 'id',
      context: { username: 'alice', keyProp: 'hacked' },
    });

    await nextTick();

    expect((wrapper.vm.formState as any).username).toBe('alice');
    expect((wrapper.vm.formState as any).keyProp).toBe('id');
  });

  test('context 里的 accessor 保持读时求值', async () => {
    let counter = 0;
    const wrapper = mountForm({
      context: Object.defineProperties(
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

    // 每次读都重新求值，而不是挂载时快照一次
    const first = (wrapper.vm.formState as any).stage;
    const second = (wrapper.vm.formState as any).stage;
    expect(first).toMatch(/^stage-\d+$/);
    expect(second).not.toBe(first);
  });

  test('Object.entries(formState) 能枚举到 context 字段', async () => {
    const wrapper = mountForm({ context: { username: 'alice', env: 'prod' } });

    await nextTick();

    const keys = Object.keys(wrapper.vm.formState as any);
    expect(keys).toContain('username');
    expect(keys).toContain('env');
    expect(keys).toContain('values');
  });

  test('context 变化后 formState 读到新值，且不残留旧 key', async () => {
    const context = ref<Record<string, any>>({ username: 'alice', stale: 1 });
    const wrapper = mountForm({ context: context.value });

    await nextTick();
    expect((wrapper.vm.formState as any).username).toBe('alice');

    await wrapper.setProps({ context: { username: 'bob' } });
    await nextTick();

    expect((wrapper.vm.formState as any).username).toBe('bob');
    expect((wrapper.vm.formState as any).stale).toBeUndefined();
  });

  test('defaultValue 首轮就能读到 context 注入的字段', async () => {
    const seen: any[] = [];
    const wrapper = mountForm({
      context: { username: 'alice' },
      config: [
        {
          text: 'u',
          name: 'u',
          type: 'text',
          defaultValue: (mForm: any) => {
            seen.push(mForm?.username);
            return mForm?.username;
          },
        },
      ],
    });

    await nextTick();
    await nextTick();
    await nextTick();

    expect(seen[0]).toBe('alice');
    expect(wrapper.vm.values.u).toBe('alice');
  });

  test('formState 直写扩展字段优先于 context', async () => {
    const wrapper = mountForm({
      context: { stage: 'from-context' },
    });

    await nextTick();
    (wrapper.vm.formState as any).stage = 'assigned';
    await nextTick();

    expect((wrapper.vm.formState as any).stage).toBe('assigned');
  });

  test('嵌套 MForm 通过 FORM_CONTEXT_KEY 继承祖先 context', async () => {
    const parentComponent = defineComponent({
      setup() {
        provide(
          FORM_CONTEXT_KEY,
          computed(() => ({ username: 'ancestor', env: 'prod' })),
        );
        return () => h(MForm, { initValues: {}, config: [] });
      },
    });

    const wrapper = mount(parentComponent, {
      global: {
        plugins: [ElementPlus as any, MagicForm as any],
      },
    });
    await nextTick();
    await nextTick();

    const formState = wrapper.findComponent(MForm).vm.formState as any;
    expect(formState.username).toBe('ancestor');
    expect(formState.env).toBe('prod');
    expect(Object.keys(formState)).toEqual(expect.arrayContaining(['username', 'env', 'values']));
    expect(Object.getOwnPropertyDescriptor(formState, 'username')?.enumerable).toBe(true);
  });

  test('子表单 props.context 覆盖祖先同名字段，未覆盖的仍可读', async () => {
    const parentComponent = defineComponent({
      setup() {
        provide(
          FORM_CONTEXT_KEY,
          computed(() => ({ username: 'ancestor', env: 'prod' })),
        );
        return () =>
          h(MForm, {
            initValues: {},
            config: [],
            context: { username: 'child' },
          });
      },
    });

    const wrapper = mount(parentComponent, {
      global: {
        plugins: [ElementPlus as any, MagicForm as any],
      },
    });
    await nextTick();
    await nextTick();

    const formState = wrapper.findComponent(MForm).vm.formState as any;
    expect(formState.username).toBe('child');
    expect(formState.env).toBe('prod');
  });

  test('未传 context 也未有祖先注入时，读扩展字段为 undefined 且不抛错', async () => {
    const wrapper = mountForm({});
    await nextTick();

    expect(wrapper.find('.m-form').exists()).toBe(true);
    expect((wrapper.vm.formState as any).whatever).toBeUndefined();
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

describe('Form.vue —— validate 校验实例方法（返回错误文案，不抛异常）', () => {
  test('校验通过返回空字符串，且不触发 error 事件', async () => {
    const wrapper = mountForm({
      config: [{ text: 'text', type: 'text', name: 'text' }],
      initValues: { text: 'hi' },
    });
    await nextTick();

    const result = await wrapper.vm.validate();
    expect(result).toBe('');
    expect(wrapper.emitted('error')).toBeFalsy();
  });

  test('校验失败返回汇总后的错误文案（含字段 text），且不触发 error 事件、不抛异常', async () => {
    const wrapper = mountForm({
      config: [{ text: '名称', type: 'text', name: 'name' }],
      initValues: { name: '' },
    });
    await nextTick();

    const tmForm = wrapper.findComponent({ name: 'TMForm' });
    const { exposed } = (tmForm.vm as any).$;
    exposed.validate = vi.fn().mockRejectedValue({
      name: [{ field: 'name', message: '必填' }],
    });

    const result = await wrapper.vm.validate();
    expect(result).toBe('名称 -> 必填');
    // 校验失败仅通过返回值给出错误文案，不触发 error 事件
    expect(wrapper.emitted('error')).toBeFalsy();
  });

  test('校验返回非 true（tdesign 风格）时也返回错误文案', async () => {
    const wrapper = mountForm({
      config: [{ text: '账号', type: 'text', name: 'account' }],
      initValues: { account: '' },
    });
    await nextTick();

    const tmForm = wrapper.findComponent({ name: 'TMForm' });
    const { exposed } = (tmForm.vm as any).$;
    exposed.validate = vi.fn().mockResolvedValue({
      account: [{ field: 'account', message: '不能为空' }],
    });

    const result = await wrapper.vm.validate();
    expect(result).toContain('账号 -> 不能为空');
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

/**
 * 字段的值初始化写入（`date` 归一化、`display` 的 `initValue` 等）统一由 `applyMountValueEffects`
 * 在表单值初始化完成后执行一次，字段组件自身不再在 setup 里改写 model。
 */
describe('Form.vue —— 字段值初始化统一执行', () => {
  test('字段未渲染出来时值同样被规整', async () => {
    const wrapper = mountForm({
      config: [
        {
          type: 'fieldset',
          name: 'wrap',
          expand: true,
          checkbox: { name: 'value', trueValue: 1, falseValue: 0 },
          items: [{ type: 'date', name: 'start', text: '开始', valueFormat: 'YYYY-MM-DD' }],
        },
      ],
      initValues: { wrap: { value: 0, start: '2021/07/17 15:37:00' } },
    });
    await nextTick();
    await nextTick();

    // 勾选框未勾选，内部字段没有渲染
    expect(wrapper.findComponent({ name: 'MFormDate' }).exists()).toBe(false);
    expect(wrapper.vm.values.wrap.start).toBe('2021-07-17');
  });

  test('initValues 变化后重新初始化，值仍被规整', async () => {
    const config = [{ type: 'date', name: 'start', text: '开始', valueFormat: 'YYYY-MM-DD' }];
    const wrapper = mountForm({ config, initValues: { start: '2021/07/17 15:37:00' } });
    await nextTick();
    await nextTick();

    expect(wrapper.vm.values.start).toBe('2021-07-17');

    await wrapper.setProps({ initValues: { start: '2022/08/18 15:37:00' } });
    await nextTick();
    await nextTick();

    expect(wrapper.vm.values.start).toBe('2022-08-18');
  });

  test('对比模式下待对比的那份值同样被规整', async () => {
    const wrapper = mountForm({
      isCompare: true,
      config: [{ type: 'date', name: 'start', text: '开始', valueFormat: 'YYYY-MM-DD' }],
      initValues: { start: '2021/07/17 15:37:00' },
      lastValues: { start: '2021/07/17 09:00:00' },
    });
    await nextTick();
    await nextTick();
    await nextTick();

    expect(wrapper.vm.values.start).toBe('2021-07-17');
    // 两份值都归一化后才不会比出「只是格式不同」的假差异
    expect(wrapper.vm.lastValuesProcessed.start).toBe('2021-07-17');
  });

  test('group-list 新增行的值被规整', async () => {
    const wrapper = mountForm({
      config: [
        {
          type: 'group-list',
          name: 'list',
          items: [
            {
              type: 'date',
              name: 'start',
              text: '开始',
              valueFormat: 'YYYY-MM-DD',
              defaultValue: '2021/07/17 15:37:00',
            },
          ],
        },
      ],
      initValues: { list: [] },
    });
    await nextTick();

    const addButton = wrapper.findAll('button').find((btn) => btn.text().includes('新增'));
    await addButton?.trigger('click');
    await nextTick();

    expect(wrapper.vm.values.list[0].start).toBe('2021-07-17');
  });

  test('group-list 走 enum 新增时值也被规整', async () => {
    const wrapper = mountForm({
      config: [
        {
          type: 'group-list',
          name: 'list',
          enum: [{ id: 1, start: '2021/07/17 15:37:00' }],
          items: [{ type: 'date', name: 'start', text: '开始', valueFormat: 'YYYY-MM-DD' }],
        },
      ],
      initValues: { list: [] },
    });
    await nextTick();

    const addButton = wrapper.findAll('button').find((btn) => btn.text().includes('新增'));
    await addButton?.trigger('click');
    await nextTick();

    expect(wrapper.vm.values.list[0].start).toBe('2021-07-17');
  });
});

describe('Form.vue —— 配置变化是否触发重挂', () => {
  const makeConfig = () => [
    {
      type: 'text',
      name: 'title',
      text: '标题',
      // 宿主每次重新生成配置时都是新闭包
      display: () => true,
      onChange: (_mForm: any, v: any) => v,
    },
  ];

  test('结构不变、只有闭包换了新实例时不卸载重挂', async () => {
    const wrapper = mountForm({ config: makeConfig(), initValues: { title: 'a' } });
    await nextTick();
    await nextTick();

    const before = wrapper.find('input').element;
    expect(before).toBeTruthy();

    await wrapper.setProps({ config: makeConfig(), initValues: { title: 'b' } });
    await nextTick();
    await nextTick();

    // 同一个 DOM 节点还在，说明表单没有被销毁重建，滚动位置/焦点才不会丢
    expect(wrapper.find('input').element).toBe(before);
    expect(wrapper.vm.initialized).toBe(true);
  });

  test('结构真的变了（换字段）时仍然重挂', async () => {
    const wrapper = mountForm({ config: makeConfig(), initValues: { title: 'a' } });
    await nextTick();
    await nextTick();

    const before = wrapper.find('input').element;

    await wrapper.setProps({
      config: [{ type: 'text', name: 'subtitle', text: '副标题' }],
      initValues: { subtitle: 'b' },
    });
    await nextTick();
    await nextTick();

    expect(wrapper.find('input').element).not.toBe(before);
  });
});
