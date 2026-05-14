/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import CodeParams from '@editor/components/CodeParams.vue';
import * as utilsMod from '@editor/utils';

const submitMock = vi.fn();
let lastConfig: any;

vi.mock('@tmagic/form', () => ({
  MForm: defineComponent({
    name: 'MFormStub',
    props: ['config', 'initValues', 'disabled', 'size', 'watchProps'],
    emits: ['change'],
    setup(props, { expose, emit }) {
      lastConfig = props.config;
      expose({ submitForm: submitMock });
      return () =>
        h('div', {
          class: 'form-stub',
          onClick: () => emit('change', { ok: true }, { changeRecords: [] }),
        });
    },
  }),
}));

vi.mock('@editor/utils', () => ({
  error: vi.fn(),
}));

describe('CodeParams.vue', () => {
  beforeEach(() => {
    submitMock.mockReset();
    lastConfig = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('config 中包含 vs-code 类型时直接保留', () => {
    mount(CodeParams as any, {
      props: {
        model: { p: {} },
        name: 'p',
        paramsConfig: [{ name: 'a', text: 'A', type: 'vs-code' }] as any,
      },
    });
    expect(lastConfig[0].items[0].type).toBe('vs-code');
  });

  test('config 中其它类型会包装成 data-source-field-select', () => {
    mount(CodeParams as any, {
      props: {
        model: { p: {} },
        name: 'p',
        paramsConfig: [{ name: 'a', text: 'A', type: 'text' }] as any,
      },
    });
    expect(lastConfig[0].items[0].type).toBe('data-source-field-select');
    expect(lastConfig[0].items[0].fieldConfig.type).toBe('text');
  });

  test('config.type 为函数时执行函数判断类型', () => {
    const typeFn = vi.fn(() => 'vs-code');
    mount(CodeParams as any, {
      props: {
        model: { p: { x: 1 } },
        name: 'p',
        paramsConfig: [{ name: 'a', text: 'A', type: typeFn }] as any,
      },
    });
    expect(typeFn).toHaveBeenCalledWith(undefined, { model: { x: 1 } });
    expect(lastConfig[0].items[0].name).toBe('a');
  });

  test('change 事件成功时 emit change 携带值', async () => {
    submitMock.mockResolvedValueOnce({ p: { a: 1 } });
    const wrapper = mount(CodeParams as any, {
      props: {
        model: { p: {} },
        name: 'p',
        paramsConfig: [{ name: 'a', text: 'A', type: 'vs-code' }] as any,
      },
    });
    await wrapper.find('.form-stub').trigger('click');
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));
    const events = wrapper.emitted('change') as any[];
    expect(events?.[0]?.[0]).toEqual({ p: { a: 1 } });
  });

  test('submitForm 抛错时调用 error 不抛出', async () => {
    submitMock.mockRejectedValueOnce(new Error('bad'));
    const wrapper = mount(CodeParams as any, {
      props: {
        model: { p: {} },
        name: 'p',
        paramsConfig: [{ name: 'a', text: 'A', type: 'vs-code' }] as any,
      },
    });
    await wrapper.find('.form-stub').trigger('click');
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));
    expect((utilsMod as any).error).toHaveBeenCalled();
  });
});
