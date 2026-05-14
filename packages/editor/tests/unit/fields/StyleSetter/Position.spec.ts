/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import Position from '@editor/fields/StyleSetter/pro/Position.vue';

vi.mock('@tmagic/form', () => ({
  defineFormItem: (cfg: any) => cfg,
  MContainer: defineComponent({
    name: 'FakeMContainer',
    props: ['config', 'model', 'size', 'disabled'],
    emits: ['change'],
    setup(props, { emit }) {
      return () =>
        h(
          'div',
          {
            class: 'fake-mcontainer',
            onClick: () => emit('change', 'val', { propPath: 'p' }),
          },
          JSON.stringify(props.config?.items?.length || 0),
        );
    },
  }),
}));

describe('StyleSetter/Position.vue', () => {
  test('渲染 MContainer 并冒泡 change', async () => {
    const wrapper = mount(Position, {
      props: {
        values: { position: 'absolute' },
      } as any,
    });
    expect(wrapper.find('.fake-mcontainer').exists()).toBe(true);
    await wrapper.find('.fake-mcontainer').trigger('click');
    expect(wrapper.emitted('change')?.[0]).toEqual(['val', { propPath: 'p' }]);
  });

  test('display 函数在 position 为 static 时返回 false', () => {
    const wrapper = mount(Position, {
      props: {
        values: { position: 'static' },
      } as any,
    });
    const config = wrapper.findComponent({ name: 'FakeMContainer' }).props('config') as any;
    const rowItems = config.items.filter((it: any) => it.type === 'row');
    expect(rowItems[0].display()).toBe(false);
  });

  test('display 函数在 position 不为 static 时返回 true', () => {
    const wrapper = mount(Position, {
      props: {
        values: { position: 'absolute' },
      } as any,
    });
    const config = wrapper.findComponent({ name: 'FakeMContainer' }).props('config') as any;
    const rowItems = config.items.filter((it: any) => it.type === 'row');
    expect(rowItems[0].display()).toBe(true);
  });
});
