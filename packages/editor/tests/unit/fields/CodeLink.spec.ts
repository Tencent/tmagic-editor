/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import CodeLink from '@editor/fields/CodeLink.vue';

const FakeMLink = defineComponent({
  name: 'MLink',
  props: ['config', 'model', 'name'],
  emits: ['change'],
  setup(props, { emit }) {
    return () =>
      h(
        'div',
        {
          class: 'fake-mlink',
          onClick: () => emit('change', { [(props.config as any).form[0].name]: '({ a: 1 })' }),
        },
        JSON.stringify((props.model as any).form),
      );
  },
});

vi.mock('@tmagic/form', () => ({
  MLink: FakeMLink,
}));

vi.mock('@editor/utils/config', () => ({
  getEditorConfig: () => (str: string) => {
    if (str.includes('error')) throw new Error('parse error');
    return { parsed: str };
  },
}));

describe('CodeLink.vue', () => {
  test('渲染 MLink 并响应初始化值', async () => {
    const model: any = { fn: { foo: 1 } };
    const wrapper = mount(CodeLink, {
      props: {
        name: 'fn',
        prop: 'fn',
        config: { type: 'code-link', codeOptions: { lineNumbers: true } } as any,
        model,
      } as any,
      global: {
        components: { MLink: FakeMLink },
      },
    });
    await nextTick();
    expect(wrapper.find('.fake-mlink').exists()).toBe(true);
    expect(wrapper.text()).toContain('foo');
  });

  test('change 事件解析并写入 model', async () => {
    const model: any = { fn: '' };
    const wrapper = mount(CodeLink, {
      props: {
        name: 'fn',
        prop: 'fn',
        config: { type: 'code-link' } as any,
        model,
      } as any,
      global: {
        components: { MLink: FakeMLink },
      },
    });
    await wrapper.find('.fake-mlink').trigger('click');
    expect(model.fn).toEqual({ parsed: '(({ a: 1 }))' });
    expect(wrapper.emitted('change')?.[0]).toEqual([{ parsed: '(({ a: 1 }))' }]);
  });

  test('parse 异常时不抛出', async () => {
    vi.resetModules();
    vi.doMock('@editor/utils/config', () => ({
      getEditorConfig: () => () => {
        throw new Error('boom');
      },
    }));
    const codeLinkComp = (await import('@editor/fields/CodeLink.vue')).default;
    const model: any = { fn: '' };
    const wrapper = mount(codeLinkComp, {
      props: {
        name: 'fn',
        prop: 'fn',
        config: { type: 'code-link' } as any,
        model,
      } as any,
      global: {
        components: { MLink: FakeMLink },
      },
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await wrapper.find('.fake-mlink').trigger('click');
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
    vi.doUnmock('@editor/utils/config');
  });

  test('name 缺失时直接返回 (无 change 触发)', async () => {
    const wrapper = mount(CodeLink, {
      props: {
        name: 'fn',
        prop: 'fn',
        config: { type: 'code-link' } as any,
        model: { fn: '' },
      } as any,
      global: {
        components: { MLink: FakeMLink },
      },
    });
    await wrapper.setProps({ name: '' } as any);
    await wrapper.find('.fake-mlink').trigger('click');
    expect(wrapper.emitted('change')).toBeFalsy();
  });
});
