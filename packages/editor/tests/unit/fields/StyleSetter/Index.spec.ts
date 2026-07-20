/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import StyleSetter from '@editor/fields/StyleSetter/Index.vue';

vi.mock('@tmagic/design', () => ({
  TMagicCollapse: defineComponent({
    name: 'TMagicCollapse',
    props: ['modelValue'],
    setup(_props, { slots }) {
      return () => h('div', { class: 'collapse' }, slots.default?.());
    },
  }),
  TMagicCollapseItem: defineComponent({
    name: 'TMagicCollapseItem',
    props: ['name'],
    setup(_props, { slots }) {
      return () => h('div', { class: 'collapse-item' }, [slots.title?.(), slots.default?.()]);
    },
  }),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({ name: 'MIcon', props: ['icon'], setup: () => () => h('i') }),
}));

vi.mock('@editor/fields/StyleSetter/pro/index', () => {
  const make = (name: string) =>
    defineComponent({
      name,
      props: ['values', 'lastValues', 'isCompare', 'size', 'disabled', 'prop'],
      emits: ['change', 'addDiffCount'],
      setup(_p, { emit }) {
        return () =>
          h('div', {
            class: name,
            onClick: () => emit('change', { foo: 1 }, { changeRecords: [{ propPath: 'foo', value: 1 }] }),
            onDblclick: () => emit('addDiffCount'),
          });
      },
    });
  return {
    Layout: make('Layout'),
    Position: make('Position'),
    Background: make('Background'),
    Font: make('Font'),
    Border: make('Border'),
    Transform: make('Transform'),
  };
});

describe('StyleSetter Index', () => {
  test('渲染 6 个 collapse-item', () => {
    const wrapper = mount(StyleSetter, {
      props: { model: { style: {} }, name: 'style', prop: 'style' } as any,
    });
    expect(wrapper.findAll('.collapse-item').length).toBe(6);
  });

  test('change 透传原始 value 并保留 changeRecords 其他字段', async () => {
    const wrapper = mount(StyleSetter, {
      props: { model: { style: {} }, name: 'style', prop: 'style' } as any,
    });
    await wrapper.find('.Background').trigger('click');
    const events = wrapper.emitted('change');
    expect(events).toBeTruthy();
    const [value, eventData] = events![0] as any[];
    expect(value).toEqual({ foo: 1 });
    expect(eventData.changeRecords).toHaveLength(1);
    expect(eventData.changeRecords[0]).toEqual({ propPath: 'foo', value: 1 });
  });

  test('eventData 无 changeRecords 时也能正常 emit', async () => {
    const wrapper = mount(StyleSetter, {
      props: { model: { style: {} }, name: 'style', prop: 'style' } as any,
      global: {
        stubs: {
          Layout: defineComponent({
            name: 'LayoutStub',
            emits: ['change'],
            setup(_p, { emit }) {
              return () => h('div', { class: 'Layout-no-records', onClick: () => emit('change', { foo: 2 }, {}) });
            },
          }),
        },
      },
    });
    await wrapper.find('.Layout-no-records').trigger('click');
    const events = wrapper.emitted('change');
    expect(events).toBeTruthy();
    expect((events?.[0]?.[1] as any).changeRecords).toBeUndefined();
  });

  test('values/size/disabled 正确透传到子组件', () => {
    const wrapper = mount(StyleSetter, {
      props: {
        model: { style: { color: 'red' } },
        name: 'style',
        prop: 'style',
        size: 'small',
        disabled: true,
      } as any,
    });
    const layout = wrapper.findComponent({ name: 'Layout' });
    expect(layout.props('values')).toEqual({ color: 'red' });
    expect(layout.props('size')).toBe('small');
    expect(layout.props('disabled')).toBe(true);
  });

  test('lastValues/isCompare 正确透传到子组件', () => {
    const wrapper = mount(StyleSetter, {
      props: {
        model: { style: { color: 'red' } },
        lastValues: { style: { color: 'blue' } },
        isCompare: true,
        name: 'style',
        prop: 'style',
      } as any,
    });
    const layout = wrapper.findComponent({ name: 'Layout' });
    expect(layout.props('lastValues')).toEqual({ color: 'blue' });
    expect(layout.props('isCompare')).toBe(true);
  });

  test('lastValues 为空时透传 undefined / isCompare 默认 false', () => {
    const wrapper = mount(StyleSetter, {
      props: { model: { style: {} }, name: 'style', prop: 'style' } as any,
    });
    const layout = wrapper.findComponent({ name: 'Layout' });
    expect(layout.props('lastValues')).toBeUndefined();
    // Boolean 类型 prop 未传时 Vue 默认为 false
    expect(layout.props('isCompare')).toBe(false);
  });

  test('子组件 addDiffCount 事件向上冒泡', async () => {
    const wrapper = mount(StyleSetter, {
      props: {
        model: { style: {} },
        lastValues: { style: {} },
        isCompare: true,
        name: 'style',
        prop: 'style',
      } as any,
    });
    await wrapper.find('.Layout').trigger('dblclick');
    expect(wrapper.emitted('addDiffCount')).toBeTruthy();
    expect(wrapper.emitted('addDiffCount')?.length).toBe(1);

    await wrapper.find('.Background').trigger('dblclick');
    expect(wrapper.emitted('addDiffCount')?.length).toBe(2);
  });
});
