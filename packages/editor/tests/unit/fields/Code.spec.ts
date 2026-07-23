/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { FORM_SILENT_MODE_KEY } from '@tmagic/form';

import Code from '@editor/fields/Code.vue';

// 用一个简单的桩组件代替 MagicCodeEditor，把所有 props 原样渲染到 data-* 属性上，
// 这样可以直接断言父组件 Code.vue 透传过去的内容是否正确。
vi.mock('@editor/layouts/CodeEditor.vue', () => ({
  default: defineComponent({
    name: 'CodeEditor',
    props: {
      height: { type: [String, Number], default: undefined },
      type: { type: String, default: undefined },
      initValues: { type: null, default: undefined },
      modifiedValues: { type: null, default: undefined },
      language: { type: String, default: undefined },
      options: { type: Object, default: undefined },
      autosize: { type: Object, default: undefined },
      parse: { type: Boolean, default: undefined },
      editorCustomType: { type: String, default: undefined },
    },
    emits: ['save'],
    setup(p, { emit }) {
      return () =>
        h('div', {
          class: 'fake-code-editor',
          'data-height': p.height,
          'data-type': p.type ?? '',
          'data-language': p.language ?? '',
          'data-init': JSON.stringify(p.initValues ?? null),
          'data-modified': JSON.stringify(p.modifiedValues ?? null),
          'data-options': JSON.stringify(p.options ?? null),
          'data-autosize': JSON.stringify(p.autosize ?? null),
          'data-parse': String(p.parse ?? ''),
          'data-custom-type': p.editorCustomType ?? '',
          onClick: () => emit('save', 'newvalue'),
        });
    },
  }),
}));

const mountCode = (props: Record<string, any>, global?: Record<string, any>) =>
  mount(Code, {
    props: {
      // FieldProps 必填字段，用 as any 绕过测试中类型严格匹配
      config: { height: '100px', language: 'javascript' },
      model: { codeField: 'oldval' },
      name: 'codeField',
      prop: 'codeField',
      ...props,
    } as any,
    global,
  });

const getEl = (wrapper: ReturnType<typeof mountCode>) => wrapper.find('.fake-code-editor').element as HTMLElement;

const readJson = (el: HTMLElement, attr: string) => JSON.parse(el.getAttribute(attr) || 'null');

describe('Code', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本透传与事件', () => {
    test('save 触发 change 事件，参数原样透传 (字符串)', async () => {
      const wrapper = mountCode({});
      await wrapper.find('.fake-code-editor').trigger('click');
      expect(wrapper.emitted('change')?.[0]?.[0]).toBe('newvalue');
    });

    test('save 触发 change 事件，参数可以是对象', async () => {
      // 替换桩的 emit 内容：通过自定义子组件方式覆盖默认 emit value 时太复杂，
      // 这里直接以 vm.$emit 等价的方式构造数据：通过 wrapper 触发 onClick 是字符串，
      // 但 setup 内 save 函数本身也接受任意类型，因此用一个最小用例验证函数行为：
      const wrapper = mountCode({});
      // 直接调用底层桩组件 emit，模拟 save 抛出对象
      const child = wrapper.findComponent({ name: 'CodeEditor' });
      child.vm.$emit('save', { a: 1 });
      expect(wrapper.emitted('change')?.[0]?.[0]).toEqual({ a: 1 });
    });

    test('透传 height / language / autosize / parse / editorCustomType', () => {
      const wrapper = mountCode({
        config: {
          height: '200px',
          language: 'json',
          autosize: { minRows: 2, maxRows: 8 },
          parse: true,
          mFormItemType: 'vs-code-extra',
          options: { tabSize: 4 },
        },
      });
      const el = getEl(wrapper);
      expect(el.getAttribute('data-height')).toBe('200px');
      expect(el.getAttribute('data-language')).toBe('json');
      expect(readJson(el, 'data-autosize')).toEqual({ minRows: 2, maxRows: 8 });
      expect(el.getAttribute('data-parse')).toBe('true');
      expect(el.getAttribute('data-custom-type')).toBe('vs-code-extra');
    });

    test('组件名为 MFieldsVsCode', () => {
      const wrapper = mountCode({});
      expect((wrapper.vm.$options as any).name).toBe('MFieldsVsCode');
    });
  });

  describe('非 diff 模式 (非对比)', () => {
    test('init-values 来自 model[name]，modified-values 为 null/undefined', () => {
      const wrapper = mountCode({
        model: { codeField: 'hello' },
      });
      const el = getEl(wrapper);
      expect(el.getAttribute('data-type')).toBe('');
      expect(readJson(el, 'data-init')).toBe('hello');
      expect(readJson(el, 'data-modified')).toBe(null);
    });

    test('disabled=true 时 options.readOnly=true', () => {
      const wrapper = mountCode({ disabled: true });
      const el = getEl(wrapper);
      expect(readJson(el, 'data-options')).toMatchObject({ readOnly: true });
    });

    test('disabled=false 时 options.readOnly=false', () => {
      const wrapper = mountCode({ disabled: false });
      const el = getEl(wrapper);
      expect(readJson(el, 'data-options')).toMatchObject({ readOnly: false });
    });

    test('readOnly 应覆盖 config.options 中已有的 readOnly 字段', () => {
      const wrapper = mountCode({
        // 故意把 config.options.readOnly 设为 true，期望 disabled=false 时仍以 disabled 为准
        config: { height: '100px', language: 'javascript', options: { tabSize: 4, readOnly: true } },
        disabled: false,
      });
      const el = getEl(wrapper);
      const opts = readJson(el, 'data-options');
      expect(opts.tabSize).toBe(4);
      expect(opts.readOnly).toBe(false);
    });

    test('isCompare=true 但缺少 lastValues 时不进入 diff', () => {
      const wrapper = mountCode({
        isCompare: true,
        // 不传 lastValues
        model: { codeField: 'cur' },
      });
      const el = getEl(wrapper);
      expect(el.getAttribute('data-type')).toBe('');
      expect(readJson(el, 'data-init')).toBe('cur');
      expect(readJson(el, 'data-modified')).toBe(null);
    });

    test('isCompare=false 即使带 lastValues 也不进入 diff', () => {
      const wrapper = mountCode({
        isCompare: false,
        lastValues: { codeField: 'old' },
        model: { codeField: 'cur' },
      });
      const el = getEl(wrapper);
      expect(el.getAttribute('data-type')).toBe('');
      expect(readJson(el, 'data-init')).toBe('cur');
    });
  });

  describe('静默模式', () => {
    test('注入 FORM_SILENT_MODE_KEY=true 时不渲染 CodeEditor', () => {
      const wrapper = mountCode(
        {},
        {
          provide: { [FORM_SILENT_MODE_KEY as symbol]: true },
        },
      );
      expect(wrapper.find('.fake-code-editor').exists()).toBe(false);
    });

    test('注入 FORM_SILENT_MODE_KEY=false 时正常渲染 CodeEditor', () => {
      const wrapper = mountCode(
        {},
        {
          provide: { [FORM_SILENT_MODE_KEY as symbol]: false },
        },
      );
      expect(wrapper.find('.fake-code-editor').exists()).toBe(true);
    });
  });

  describe('diff 模式 (对比)', () => {
    test('isCompare=true 且有 lastValues 时切换为 diff 模式', () => {
      const wrapper = mountCode({
        isCompare: true,
        lastValues: { codeField: 'old' },
        model: { codeField: 'new' },
      });
      const el = getEl(wrapper);
      expect(el.getAttribute('data-type')).toBe('diff');
      expect(readJson(el, 'data-init')).toBe('old');
      expect(readJson(el, 'data-modified')).toBe('new');
    });

    test('diff 模式下 readOnly 强制为 true，忽略 disabled', () => {
      const wrapper = mountCode({
        isCompare: true,
        lastValues: { codeField: 'old' },
        model: { codeField: 'new' },
        disabled: false,
      });
      const el = getEl(wrapper);
      expect(readJson(el, 'data-options')).toMatchObject({ readOnly: true });
    });

    test('diff 模式下当 lastValues 中无对应 name 字段时，init-values 退化为 null/{}', () => {
      const wrapper = mountCode({
        isCompare: true,
        // 有 lastValues 对象但没有该字段
        lastValues: {},
        model: { codeField: 'new' },
      });
      const el = getEl(wrapper);
      expect(el.getAttribute('data-type')).toBe('diff');
      // 源码逻辑：(lastValues || {})[name]，此处 lastValues 是 {}，结果为 undefined
      expect(readJson(el, 'data-init')).toBe(null);
      expect(readJson(el, 'data-modified')).toBe('new');
    });

    test('切换 isCompare 时模式跟随变化', async () => {
      const wrapper = mountCode({
        isCompare: false,
        lastValues: { codeField: 'old' },
        model: { codeField: 'new' },
      });
      expect(getEl(wrapper).getAttribute('data-type')).toBe('');

      await wrapper.setProps({ isCompare: true } as any);
      expect(getEl(wrapper).getAttribute('data-type')).toBe('diff');
      expect(readJson(getEl(wrapper), 'data-init')).toBe('old');
      expect(readJson(getEl(wrapper), 'data-modified')).toBe('new');
    });

    test('切换 lastValues 后 init-values 同步更新', async () => {
      const wrapper = mountCode({
        isCompare: true,
        lastValues: { codeField: 'v1' },
        model: { codeField: 'cur' },
      });
      expect(readJson(getEl(wrapper), 'data-init')).toBe('v1');

      await wrapper.setProps({ lastValues: { codeField: 'v2' } } as any);
      expect(readJson(getEl(wrapper), 'data-init')).toBe('v2');
    });

    test('diff 模式下 model 变化时 modified-values 同步更新', async () => {
      const wrapper = mountCode({
        isCompare: true,
        lastValues: { codeField: 'old' },
        model: { codeField: 'a' },
      });
      expect(readJson(getEl(wrapper), 'data-modified')).toBe('a');

      await wrapper.setProps({ model: { codeField: 'b' } } as any);
      expect(readJson(getEl(wrapper), 'data-modified')).toBe('b');
    });
  });
});
