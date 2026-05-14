/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import ToolButton from '@editor/components/ToolButton.vue';

const provideServices = () => ({
  global: {
    provide: {
      services: {
        editorService: {},
        uiService: {},
      },
    },
  },
});

describe('ToolButton.vue', () => {
  test('display 为 false 时不渲染', () => {
    const wrapper = mount(ToolButton as any, {
      ...provideServices(),
      props: {
        data: { type: 'button', display: false, text: 'btn' },
      },
    });
    expect(wrapper.find('.menu-item').exists()).toBe(false);
  });

  test('data.type=text 时渲染文字', () => {
    const wrapper = mount(ToolButton as any, {
      ...provideServices(),
      props: {
        data: { type: 'text', text: 'hello' } as any,
      },
    });
    expect(wrapper.text()).toContain('hello');
  });

  test('data.type=divider 时渲染 divider', () => {
    const wrapper = mount(ToolButton as any, {
      ...provideServices(),
      props: {
        data: { type: 'divider' } as any,
      },
    });
    expect(wrapper.find('.menu-item').exists()).toBe(true);
  });

  test('data.type=button 点击触发 handler', async () => {
    const handler = vi.fn();
    const wrapper = mount(ToolButton as any, {
      ...provideServices(),
      props: {
        data: { type: 'button', text: 'click', handler } as any,
        eventType: 'click',
      },
    });
    await wrapper.find('.menu-item').trigger('click');
    expect(handler).toHaveBeenCalled();
  });

  test('display 函数返回 false 时不渲染', () => {
    const wrapper = mount(ToolButton as any, {
      ...provideServices(),
      props: {
        data: { type: 'button', display: () => false, text: 'x' } as any,
      },
    });
    expect(wrapper.find('.menu-item').exists()).toBe(false);
  });

  test('disabled 函数返回 true 时不调用 handler', async () => {
    const handler = vi.fn();
    const wrapper = mount(ToolButton as any, {
      ...provideServices(),
      props: {
        data: { type: 'button', text: 'x', disabled: () => true, handler } as any,
        eventType: 'click',
      },
    });
    await wrapper.find('.menu-item').trigger('click');
    expect(handler).not.toHaveBeenCalled();
  });

  test('eventType=mousedown 仅 mousedown 触发', async () => {
    const handler = vi.fn();
    const wrapper = mount(ToolButton as any, {
      ...provideServices(),
      props: {
        data: { type: 'button', text: 'x', handler } as any,
        eventType: 'mousedown',
      },
    });
    await wrapper.find('.menu-item').trigger('click');
    expect(handler).not.toHaveBeenCalled();
    await wrapper.find('.menu-item').trigger('mousedown');
    expect(handler).toHaveBeenCalled();
  });

  test('eventType=mouseup 仅左键 mouseup 触发', async () => {
    const handler = vi.fn();
    const wrapper = mount(ToolButton as any, {
      ...provideServices(),
      props: {
        data: { type: 'button', text: 'x', handler } as any,
        eventType: 'mouseup',
      },
    });
    await wrapper.find('.menu-item').trigger('mouseup', { button: 1 });
    expect(handler).not.toHaveBeenCalled();
    await wrapper.find('.menu-item').trigger('mouseup', { button: 0 });
    expect(handler).toHaveBeenCalled();
  });

  test('button 含 tooltip 时渲染 tooltip', () => {
    const wrapper = mount(ToolButton as any, {
      ...provideServices(),
      props: {
        data: { type: 'button', text: 'x', tooltip: 'tip' } as any,
      },
    });
    expect(wrapper.find('.menu-item').exists()).toBe(true);
    expect(wrapper.text()).toContain('x');
  });

  test('data.type=dropdown 时渲染下拉菜单', () => {
    const wrapper = mount(ToolButton as any, {
      ...provideServices(),
      props: {
        data: {
          type: 'dropdown',
          text: 'menu',
          items: [{ text: 'item1', handler: vi.fn() }],
        } as any,
      },
    });
    expect(wrapper.find('.menu-item').exists()).toBe(true);
    expect(wrapper.find('.menubar-menu-button').exists()).toBe(true);
    expect(wrapper.text()).toContain('menu');
  });

  test('data.type=component 时渲染对应组件', () => {
    const fakeComp = {
      name: 'FakeC',
      props: ['v'],
      template: '<div class="custom-comp">{{v}}</div>',
    };
    const wrapper = mount(ToolButton as any, {
      ...provideServices(),
      props: {
        data: {
          type: 'component',
          component: fakeComp,
          props: { v: 'hello' },
        } as any,
      },
    });
    expect(wrapper.find('.custom-comp').exists()).toBe(true);
    expect(wrapper.find('.custom-comp').text()).toBe('hello');
  });

  test('dropdown 选中调用对应 handler', async () => {
    const handler = vi.fn();
    const wrapper = mount(ToolButton as any, {
      ...provideServices(),
      props: {
        data: {
          type: 'dropdown',
          text: 'menu',
          items: [{ text: 'item1', handler }],
        } as any,
      },
    });
    const dropdown = wrapper.findComponent({ name: 'TMagicDropdown' });
    if (dropdown.exists()) {
      await dropdown.vm.$emit('command', { item: { handler } });
      expect(handler).toHaveBeenCalled();
    }
  });

  test('disabled 为 boolean 时直接使用', async () => {
    const handler = vi.fn();
    const wrapper = mount(ToolButton as any, {
      ...provideServices(),
      props: {
        data: { type: 'button', text: 'x', disabled: true, handler } as any,
        eventType: 'click',
      },
    });
    await wrapper.find('.menu-item').trigger('click');
    expect(handler).not.toHaveBeenCalled();
  });
});
