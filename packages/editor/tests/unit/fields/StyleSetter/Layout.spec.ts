/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import Layout from '@editor/fields/StyleSetter/pro/Layout.vue';

vi.mock('@tmagic/form', () => ({
  defineFormItem: (cfg: any) => cfg,
  MContainer: defineComponent({
    name: 'FakeMContainer',
    props: ['config', 'model', 'lastValues', 'isCompare', 'size', 'disabled'],
    emits: ['change', 'addDiffCount'],
    setup(_p, { emit }) {
      return () =>
        h(
          'div',
          {
            class: 'fake-mcontainer',
            onClick: () => emit('change', 'val', { propPath: 'p' }),
            onDblclick: () => emit('addDiffCount'),
          },
          'mc',
        );
    },
  }),
}));

vi.mock('@editor/fields/StyleSetter/components/Box.vue', () => ({
  default: defineComponent({
    name: 'FakeBox',
    props: ['model', 'lastValues', 'isCompare', 'size', 'disabled'],
    emits: ['change'],
    setup(_p, { emit }) {
      return () =>
        h(
          'div',
          {
            class: 'fake-box',
            onClick: () => emit('change', 'box-val', { propPath: 'b' }),
          },
          'box',
        );
    },
  }),
}));

describe('StyleSetter/Layout.vue', () => {
  test('渲染 MContainer 与 Box，且非 fixed/absolute 时显示 Box', () => {
    const wrapper = mount(Layout, {
      props: {
        values: { position: 'static', display: 'flex' },
      } as any,
    });
    expect(wrapper.find('.fake-mcontainer').exists()).toBe(true);
    expect(wrapper.find('.fake-box').isVisible()).toBe(true);
  });

  test('position 为 fixed 时 Box 隐藏 (display:none)', () => {
    const wrapper = mount(Layout, {
      props: {
        values: { position: 'fixed', display: 'block' },
      } as any,
    });
    const el = wrapper.find('.fake-box').element as HTMLElement;
    expect(el.style.display).toBe('none');
  });

  test('change 事件冒泡', async () => {
    const wrapper = mount(Layout, {
      props: { values: { position: 'static', display: 'flex' } } as any,
    });
    await wrapper.find('.fake-mcontainer').trigger('click');
    expect(wrapper.emitted('change')?.[0]).toEqual(['val', { propPath: 'p' }]);
    await wrapper.find('.fake-box').trigger('click');
    expect(wrapper.emitted('change')?.[1]).toEqual(['box-val', { propPath: 'b' }]);
  });

  test('display 函数 model.display 为 flex 时返回 true', () => {
    const wrapper = mount(Layout, {
      props: { values: { position: 'static', display: 'flex' } } as any,
    });
    const config = wrapper.findComponent({ name: 'FakeMContainer' }).props('config') as any;
    const flexItem = config.items.find((it: any) => it.name === 'flexDirection');
    expect(flexItem.display(null, { model: { display: 'flex' } })).toBe(true);
    expect(flexItem.display(null, { model: { display: 'block' } })).toBe(false);
  });

  test('justifyContent / alignItems / flexWrap 仅 flex 时显示', () => {
    const wrapper = mount(Layout, {
      props: { values: { position: 'static', display: 'flex' } } as any,
    });
    const config = wrapper.findComponent({ name: 'FakeMContainer' }).props('config') as any;
    ['justifyContent', 'alignItems', 'flexWrap'].forEach((name) => {
      const item = config.items.find((it: any) => it.name === name);
      expect(item.display(null, { model: { display: 'flex' } })).toBe(true);
      expect(item.display(null, { model: { display: 'block' } })).toBe(false);
    });
  });

  test('display 选项含 inline/flex/block/inline-block/none', () => {
    const wrapper = mount(Layout, {
      props: { values: { position: 'static', display: 'flex' } } as any,
    });
    const config = wrapper.findComponent({ name: 'FakeMContainer' }).props('config') as any;
    const displayItem = config.items.find((it: any) => it.name === 'display');
    const values = displayItem.options.map((o: any) => o.value);
    expect(values).toEqual(['inline', 'flex', 'block', 'inline-block', 'none']);
  });

  test('lastValues/isCompare 透传到 MContainer 与 Box', () => {
    const wrapper = mount(Layout, {
      props: {
        values: { position: 'static', display: 'flex' },
        lastValues: { position: 'relative', display: 'block' },
        isCompare: true,
      } as any,
    });
    const container = wrapper.findComponent({ name: 'FakeMContainer' });
    expect(container.props('lastValues')).toEqual({ position: 'relative', display: 'block' });
    expect(container.props('isCompare')).toBe(true);
    const box = wrapper.findComponent({ name: 'FakeBox' });
    expect(box.props('lastValues')).toEqual({ position: 'relative', display: 'block' });
    expect(box.props('isCompare')).toBe(true);
  });

  test('未传 lastValues 时为 undefined / isCompare 默认 false', () => {
    const wrapper = mount(Layout, {
      props: { values: { position: 'static', display: 'flex' } } as any,
    });
    const container = wrapper.findComponent({ name: 'FakeMContainer' });
    expect(container.props('lastValues')).toBeUndefined();
    // Boolean 类型 prop 未传时 Vue 默认为 false
    expect(container.props('isCompare')).toBe(false);
  });

  test('MContainer 的 addDiffCount 事件向上冒泡', async () => {
    const wrapper = mount(Layout, {
      props: { values: { position: 'static', display: 'flex' } } as any,
    });
    await wrapper.find('.fake-mcontainer').trigger('dblclick');
    expect(wrapper.emitted('addDiffCount')).toBeTruthy();
    expect(wrapper.emitted('addDiffCount')?.length).toBe(1);
  });
});
