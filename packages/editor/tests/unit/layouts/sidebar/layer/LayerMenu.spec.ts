/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import LayerMenu from '@editor/layouts/sidebar/layer/LayerMenu.vue';

const editorService = {
  get: vi.fn(),
  add: vi.fn(),
};
const componentListService = {
  getList: vi.fn(),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService, componentListService }),
}));

vi.mock('@editor/utils/content-menu', () => ({
  useCopyMenu: () => ({ type: 'button', text: 'copy' }),
  usePasteMenu: () => ({ type: 'button', text: 'paste' }),
  useDeleteMenu: () => ({ type: 'button', text: 'delete' }),
  useMoveToMenu: () => ({ type: 'button', text: 'moveto' }),
}));

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return {
    ...actual,
    isPage: (n: any) => n?.type === 'page',
    isPageFragment: (n: any) => n?.type === 'page-fragment',
  };
});

const showMock = vi.fn();
vi.mock('@editor/components/ContentMenu.vue', () => ({
  default: defineComponent({
    name: 'ContentMenu',
    props: ['menuData'],
    setup(props, { expose }) {
      expose({ show: showMock, hide: vi.fn(), menuData: props.menuData });
      return () =>
        h(
          'div',
          { class: 'fake-menu' },
          (props.menuData || []).map((m: any) =>
            h(
              'button',
              {
                class: ['menu-item', `m-${m.text}`],
                style: { display: m.display && !m.display() ? 'none' : '' },
                onClick: () => m.handler?.(),
              },
              m.text,
            ),
          ),
        );
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  editorService.get.mockImplementation((k: string) => {
    if (k === 'node') return { id: 'p1', type: 'page', items: [] };
    if (k === 'nodes') return [{ id: 'p1' }];
    return null;
  });
  componentListService.getList.mockReturnValue([
    { items: [{ text: 'btn', type: 'button', icon: 'i' }] },
    { items: [{ text: 'div', type: 'div' }] },
  ]);
});

describe('LayerMenu', () => {
  test('渲染菜单数据', () => {
    const wrapper = mount(LayerMenu, {
      props: { layerContentMenu: [], customContentMenu: (m: any) => m } as any,
    });
    expect(wrapper.find('.m-全部折叠').exists()).toBe(true);
    expect(wrapper.find('.m-新增').exists()).toBe(true);
  });

  test('全部折叠 emit collapse-all', async () => {
    const wrapper = mount(LayerMenu, {
      props: { layerContentMenu: [], customContentMenu: (m: any) => m } as any,
    });
    await wrapper.find('.m-全部折叠').trigger('click');
    expect(wrapper.emitted('collapse-all')).toBeTruthy();
  });

  test('show 调用 menuRef.show', () => {
    const wrapper = mount(LayerMenu, {
      props: { layerContentMenu: [], customContentMenu: (m: any) => m } as any,
    });
    const event = new MouseEvent('contextmenu');
    (wrapper.vm as any).show(event);
    expect(showMock).toHaveBeenCalledWith(event);
  });

  test('node.type 为 tabs 时新增 sub menu 包含标签页', () => {
    editorService.get.mockImplementation((k: string) => {
      if (k === 'node') return { id: 't', type: 'tabs', items: [] };
      if (k === 'nodes') return [{}];
      return null;
    });
    const customContentMenu = vi.fn((m) => m);
    mount(LayerMenu, {
      props: { layerContentMenu: [], customContentMenu } as any,
    });
    const arg = customContentMenu.mock.calls[0][0];
    const addItem = arg.find((m: any) => m.text === '新增');
    expect(addItem.items[0].text).toBe('标签页');
    addItem.items[0].handler();
    expect(editorService.add).toHaveBeenCalledWith({ type: 'tab-pane' }, undefined, {
      historySource: 'tree-contextmenu',
    });
  });

  test('node.items 时根据组件列表生成子菜单 (含分隔)', () => {
    editorService.get.mockImplementation((k: string) => {
      if (k === 'node') return { id: 'p1', type: 'container', items: [] };
      if (k === 'nodes') return [{}];
      return null;
    });
    const customContentMenu = vi.fn((m) => m);
    mount(LayerMenu, {
      props: { layerContentMenu: [], customContentMenu } as any,
    });
    const arg = customContentMenu.mock.calls[0][0];
    const addItem = arg.find((m: any) => m.text === '新增');
    const labels = addItem.items.map((it: any) => it.text || it.type);
    expect(labels).toContain('btn');
    expect(labels).toContain('divider');
    expect(labels).toContain('div');
  });

  test('子菜单按钮 handler 调用 editorService.add', () => {
    editorService.get.mockImplementation((k: string) => {
      if (k === 'node') return { id: 'p1', type: 'container', items: [] };
      if (k === 'nodes') return [{}];
      return null;
    });
    const customContentMenu = vi.fn((m) => m);
    mount(LayerMenu, {
      props: { layerContentMenu: [], customContentMenu } as any,
    });
    const arg = customContentMenu.mock.calls[0][0];
    const addItem = arg.find((m: any) => m.text === '新增');
    addItem.items[0].handler();
    expect(editorService.add).toHaveBeenCalledWith({ name: 'btn', type: 'button' }, undefined, {
      historySource: 'tree-contextmenu',
    });
  });
});
