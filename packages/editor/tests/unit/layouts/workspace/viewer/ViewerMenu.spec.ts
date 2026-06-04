/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import ViewerMenu from '@editor/layouts/workspace/viewer/ViewerMenu.vue';

const editorService = {
  get: vi.fn(),
  alignCenter: vi.fn(),
  moveLayer: vi.fn(),
  getLayout: vi.fn().mockResolvedValue('absolute'),
};

const stage = {
  clearGuides: vi.fn(),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService }),
}));

vi.mock('@tmagic/utils', () => ({
  isPage: (n: any) => n?.type === 'page',
  isPageFragment: (n: any) => n?.type === 'page-fragment',
}));

vi.mock('@editor/utils/content-menu', () => ({
  useCopyMenu: () => ({ type: 'button', text: '复制', handler: vi.fn() }),
  usePasteMenu: () => ({ type: 'button', text: '粘贴', handler: vi.fn() }),
  useMoveToMenu: () => ({ type: 'button', text: '移动到', handler: vi.fn() }),
  useDeleteMenu: () => ({ type: 'button', text: '删除', handler: vi.fn() }),
}));

vi.mock('@editor/components/ContentMenu.vue', () => ({
  default: defineComponent({
    name: 'FakeContentMenu',
    props: ['menuData'],
    setup(props, { expose }) {
      expose({ show: vi.fn() });
      return () =>
        h(
          'div',
          { class: 'fake-content-menu' },
          (props.menuData as any[]).map((item, i) =>
            h('span', { class: `menu-item-${i}`, 'data-text': item.text || item.type }, ''),
          ),
        );
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  editorService.get.mockImplementation((k: string) => {
    if (k === 'node') return { type: 'div' };
    if (k === 'nodes') return [{ type: 'div' }];
    if (k === 'parent') return { type: 'page' };
    if (k === 'stage') return stage;
    return null;
  });
});

describe('ViewerMenu.vue', () => {
  test('渲染菜单 (含上/下移、置顶/置底)', async () => {
    const wrapper = mount(ViewerMenu, {
      props: {
        stageContentMenu: [],
        customContentMenu: ((m: any) => m) as any,
      } as any,
    });
    await nextTick();
    const menuData = wrapper.findComponent({ name: 'FakeContentMenu' }).props('menuData') as any[];
    const labels = menuData.map((m: any) => m.text || m.type);
    expect(labels).toContain('上移一层');
    expect(labels).toContain('下移一层');
    expect(labels).toContain('置顶');
    expect(labels).toContain('置底');
    expect(labels).toContain('水平居中');
    expect(labels).toContain('清空参考线');
  });

  test('节点为 page 时上下移按钮 display 返回 false', () => {
    editorService.get.mockImplementation((k: string) => {
      if (k === 'node') return { type: 'page' };
      if (k === 'nodes') return [{ type: 'page' }];
      if (k === 'parent') return null;
      return null;
    });
    const wrapper = mount(ViewerMenu, {
      props: {
        stageContentMenu: [],
        customContentMenu: ((m: any) => m) as any,
      } as any,
    });
    const menuData = wrapper.findComponent({ name: 'FakeContentMenu' }).props('menuData') as any[];
    const moveItem = menuData.find((m: any) => m.text === '上移一层');
    expect(moveItem.display()).toBe(false);
  });

  test('alignCenter 处理器调用 editorService.alignCenter', async () => {
    const wrapper = mount(ViewerMenu, {
      props: {
        stageContentMenu: [],
        customContentMenu: ((m: any) => m) as any,
      } as any,
    });
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));
    const menuData = wrapper.findComponent({ name: 'FakeContentMenu' }).props('menuData') as any[];
    const center = menuData.find((m: any) => m.text === '水平居中');
    center.handler();
    expect(editorService.alignCenter).toHaveBeenCalled();
  });

  test('moveLayer 处理器调用 editorService.moveLayer', () => {
    const wrapper = mount(ViewerMenu, {
      props: {
        stageContentMenu: [],
        customContentMenu: ((m: any) => m) as any,
      } as any,
    });
    const menuData = wrapper.findComponent({ name: 'FakeContentMenu' }).props('menuData') as any[];
    menuData.find((m: any) => m.text === '上移一层').handler();
    expect(editorService.moveLayer).toHaveBeenCalledWith(1, { historySource: 'stage-contextmenu' });
    menuData.find((m: any) => m.text === '下移一层').handler();
    expect(editorService.moveLayer).toHaveBeenCalledWith(-1, { historySource: 'stage-contextmenu' });
    menuData.find((m: any) => m.text === '置顶').handler();
    menuData.find((m: any) => m.text === '置底').handler();
    expect(editorService.moveLayer).toHaveBeenCalledTimes(4);
  });

  test('清空参考线 调用 stage.clearGuides', () => {
    const wrapper = mount(ViewerMenu, {
      props: {
        stageContentMenu: [],
        customContentMenu: ((m: any) => m) as any,
      } as any,
    });
    const menuData = wrapper.findComponent({ name: 'FakeContentMenu' }).props('menuData') as any[];
    menuData.find((m: any) => m.text === '清空参考线').handler();
    expect(stage.clearGuides).toHaveBeenCalled();
  });

  test('parent 为 null 时不可居中', async () => {
    editorService.get.mockImplementation((k: string) => {
      if (k === 'parent') return null;
      if (k === 'nodes') return [{ type: 'div' }];
      return null;
    });
    const wrapper = mount(ViewerMenu, {
      props: {
        stageContentMenu: [],
        customContentMenu: ((m: any) => m) as any,
      } as any,
    });
    await nextTick();
    const menuData = wrapper.findComponent({ name: 'FakeContentMenu' }).props('menuData') as any[];
    const center = menuData.find((m: any) => m.text === '水平居中');
    expect(center.display()).toBe(false);
  });

  test('isMultiSelect 时上下移按钮隐藏', () => {
    const wrapper = mount(ViewerMenu, {
      props: {
        isMultiSelect: true,
        stageContentMenu: [],
        customContentMenu: ((m: any) => m) as any,
      } as any,
    });
    const menuData = wrapper.findComponent({ name: 'FakeContentMenu' }).props('menuData') as any[];
    expect(menuData.find((m: any) => m.text === '上移一层').display()).toBe(false);
  });

  test('expose show 方法调用 menuRef.show', () => {
    const wrapper = mount(ViewerMenu, {
      props: {
        stageContentMenu: [],
        customContentMenu: ((m: any) => m) as any,
      } as any,
    });
    expect(typeof (wrapper.vm as any).show).toBe('function');
    (wrapper.vm as any).show(new MouseEvent('contextmenu'));
  });
});
