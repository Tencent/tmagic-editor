/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, inject, nextTick, provide } from 'vue';
import { mount } from '@vue/test-utils';

import HistoryDiffDialog from '@editor/layouts/history-list/HistoryDiffDialog.vue';

vi.mock('@tmagic/design', () => ({
  // 受控对话框：modelValue 为真时才渲染 body / footer 插槽
  TMagicDialog: defineComponent({
    name: 'TMagicDialog',
    props: ['modelValue', 'title'],
    setup(props, { slots }) {
      return () =>
        props.modelValue ? h('div', { class: 'fake-dialog' }, [slots.default?.(), slots.footer?.()]) : null;
    },
  }),
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    emits: ['click'],
    setup(_p, { emit, slots }) {
      return () => h('button', { class: 'fake-btn', onClick: () => emit('click') }, slots.default?.());
    },
  }),
  // RadioGroup 通过 provide 把选值函数下发给内部的 RadioButton，模拟 v-model 行为
  TMagicRadioGroup: defineComponent({
    name: 'TMagicRadioGroup',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(_p, { emit, slots }) {
      provide('radioSelect', (v: string) => emit('update:modelValue', v));
      return () => h('div', { class: 'fake-radio-group' }, slots.default?.());
    },
  }),
  TMagicRadioButton: defineComponent({
    name: 'TMagicRadioButton',
    props: ['value', 'disabled'],
    setup(props, { slots }) {
      const select = inject<(v: string) => void>('radioSelect');
      return () =>
        h(
          'button',
          {
            class: 'fake-radio-btn',
            'data-value': props.value,
            'data-disabled': props.disabled ? 'true' : 'false',
            onClick: () => !props.disabled && select?.(props.value),
          },
          slots.default?.(),
        );
    },
  }),
  TMagicTag: defineComponent({
    name: 'TMagicTag',
    setup(_p, { slots }) {
      return () => h('span', { class: 'fake-tag' }, slots.default?.());
    },
  }),
}));

vi.mock('@editor/components/CompareForm.vue', () => ({
  default: defineComponent({
    name: 'CompareForm',
    props: ['category', 'type', 'dataSourceType', 'value', 'lastValue', 'extendState', 'height'],
    setup() {
      return () => h('div', { class: 'fake-compare-form' });
    },
  }),
}));

vi.mock('@editor/layouts/CodeEditor.vue', () => ({
  default: defineComponent({
    name: 'CodeEditor',
    props: ['type', 'language', 'initValues', 'modifiedValues', 'options', 'disabledFullScreen', 'height'],
    setup() {
      return () => h('div', { class: 'fake-code-editor' });
    },
  }),
}));

const services = {} as any;

const factory = () =>
  mount(HistoryDiffDialog, {
    // 让 Teleport 内容内联渲染，便于通过 wrapper 查询
    global: { stubs: { teleport: true }, provide: { services } },
  });

const basePayload = (extra: any = {}) => ({
  category: 'node',
  type: 'btn',
  lastValue: { text: 'old' },
  value: { text: 'new' },
  currentValue: { text: 'current' },
  targetLabel: '按钮',
  ...extra,
});

describe('HistoryDiffDialog.vue', () => {
  test('初始未打开时不渲染对话框 body', () => {
    const wrapper = factory();
    expect(wrapper.find('.fake-dialog').exists()).toBe(false);
  });

  test('open() 默认进入「表单对比 + 与修改前对比」，左右值正确', async () => {
    const wrapper = factory();
    (wrapper.vm as any).open(basePayload());
    await nextTick();

    expect(wrapper.find('.fake-dialog').exists()).toBe(true);
    const form = wrapper.findComponent({ name: 'CompareForm' });
    expect(form.exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'CodeEditor' }).exists()).toBe(false);

    // before 模式：左=修改前 lastValue，右=修改后 value
    expect(form.props('lastValue')).toEqual({ text: 'old' });
    expect(form.props('value')).toEqual({ text: 'new' });
    expect(form.props('category')).toBe('node');
    expect(form.props('type')).toBe('btn');
  });

  test('切换到「源码对比」渲染 CodeEditor 并透传 diff 值', async () => {
    const wrapper = factory();
    (wrapper.vm as any).open(basePayload());
    await nextTick();

    const codeRadio = wrapper.findAll('.fake-radio-btn').find((b) => b.attributes('data-value') === 'code');
    await codeRadio!.trigger('click');
    await nextTick();

    expect(wrapper.findComponent({ name: 'CompareForm' }).exists()).toBe(false);
    const code = wrapper.findComponent({ name: 'CodeEditor' });
    expect(code.exists()).toBe(true);
    expect(code.props('type')).toBe('diff');
    expect(code.props('language')).toBe('json');
    expect(code.props('initValues')).toEqual({ text: 'old' });
    expect(code.props('modifiedValues')).toEqual({ text: 'new' });
    // 源码对比强制只读、左右并排
    expect(code.props('options')).toMatchObject({ readOnly: true, renderSideBySide: true });
  });

  test('切换到「与当前对比」后左=该步修改后，右=当前值', async () => {
    const wrapper = factory();
    (wrapper.vm as any).open(basePayload());
    await nextTick();

    const currentRadio = wrapper.findAll('.fake-radio-btn').find((b) => b.attributes('data-value') === 'current');
    await currentRadio!.trigger('click');
    await nextTick();

    const form = wrapper.findComponent({ name: 'CompareForm' });
    expect(form.props('lastValue')).toEqual({ text: 'new' });
    expect(form.props('value')).toEqual({ text: 'current' });
  });

  test('currentValue 为 null 时「与当前对比」按钮禁用', async () => {
    const wrapper = factory();
    (wrapper.vm as any).open(basePayload({ currentValue: null }));
    await nextTick();

    const currentRadio = wrapper.findAll('.fake-radio-btn').find((b) => b.attributes('data-value') === 'current');
    expect(currentRadio!.attributes('data-disabled')).toBe('true');
  });

  test('targetText 按 category 生成前缀', async () => {
    const wrapper = factory();
    (wrapper.vm as any).open(basePayload({ category: 'data-source', targetLabel: '接口A' }));
    await nextTick();
    expect(wrapper.find('.m-editor-history-diff-dialog-target').text()).toBe('数据源：接口A');
  });

  test('「与当前对比」且当前值等于该步修改后值时展示无差异提示', async () => {
    const wrapper = factory();
    (wrapper.vm as any).open(basePayload({ value: { text: 'same' }, currentValue: { text: 'same' } }));
    await nextTick();

    // before 模式下不展示提示
    expect(wrapper.find('.m-editor-history-diff-dialog-tip').exists()).toBe(false);

    const currentRadio = wrapper.findAll('.fake-radio-btn').find((b) => b.attributes('data-value') === 'current');
    await currentRadio!.trigger('click');
    await nextTick();
    expect(wrapper.find('.m-editor-history-diff-dialog-tip').exists()).toBe(true);
  });

  test('再次 open() 会重置回表单对比 + 与修改前对比', async () => {
    const wrapper = factory();
    (wrapper.vm as any).open(basePayload());
    await nextTick();
    // 先切到源码 + 与当前对比
    await wrapper
      .findAll('.fake-radio-btn')
      .find((b) => b.attributes('data-value') === 'code')!
      .trigger('click');
    await wrapper
      .findAll('.fake-radio-btn')
      .find((b) => b.attributes('data-value') === 'current')!
      .trigger('click');
    await nextTick();

    (wrapper.vm as any).open(basePayload());
    await nextTick();
    expect(wrapper.findComponent({ name: 'CompareForm' }).exists()).toBe(true);
    const form = wrapper.findComponent({ name: 'CompareForm' });
    expect(form.props('lastValue')).toEqual({ text: 'old' });
  });

  test('无 onConfirm 时标题为「查看修改差异」', async () => {
    const wrapper = factory();
    (wrapper.vm as any).open(basePayload());
    await nextTick();

    expect(wrapper.findComponent({ name: 'TMagicDialog' }).props('title')).toBe('查看修改差异');
  });

  test('有 onConfirm 时标题为「确认回滚」并展示回滚说明', async () => {
    const wrapper = mount(HistoryDiffDialog, {
      global: { stubs: { teleport: true }, provide: { services } },
      props: { onConfirm: vi.fn() },
    });
    (wrapper.vm as any).open(basePayload());
    await nextTick();

    expect(wrapper.findComponent({ name: 'TMagicDialog' }).props('title')).toBe('确认回滚');
    expect(wrapper.find('.m-editor-history-diff-dialog-notice').text()).toBe('仅回滚有差异的字段');
  });

  test('无 onConfirm 时不展示回滚说明', async () => {
    const wrapper = factory();
    (wrapper.vm as any).open(basePayload());
    await nextTick();

    expect(wrapper.find('.m-editor-history-diff-dialog-notice').exists()).toBe(false);
  });

  test('close() 隐藏对话框并清空 payload', async () => {
    const wrapper = factory();
    (wrapper.vm as any).open(basePayload());
    await nextTick();
    expect(wrapper.find('.fake-dialog').exists()).toBe(true);

    (wrapper.vm as any).close();
    await nextTick();
    expect(wrapper.find('.fake-dialog').exists()).toBe(false);
  });
});
