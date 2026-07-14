/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { useContentMenu } from '@editor/layouts/sidebar/data-source/useContentMenu';

const MenuStub = defineComponent({
  name: 'ContentMenu',
  setup(_, { expose }) {
    expose({ show: vi.fn(), hide: vi.fn() });
    return () => h('div');
  },
});

const mountHook = (eventBus: any = { emit: vi.fn() }) => {
  let result: ReturnType<typeof useContentMenu> | undefined;
  const hostComp = defineComponent({
    components: { MenuStub },
    setup(_, { expose }) {
      result = useContentMenu();
      expose({ result });
      return () => h(MenuStub, { ref: 'menu' });
    },
  });
  const wrapper = mount(hostComp, { global: { provide: { eventBus } } });
  return { wrapper, result: result!, eventBus };
};

describe('data-source useContentMenu', () => {
  test('提供 menuData 和处理函数', () => {
    const { result } = mountHook();
    expect(result.menuData.length).toBe(3);
  });

  test('编辑按钮 display 取决于 dataSourceService.get(editable)', () => {
    const { result } = mountHook();
    const editBtn = result.menuData[0] as any;
    expect(editBtn.display({ dataSourceService: { get: () => true } })).toBe(true);
    expect(editBtn.display({ dataSourceService: { get: () => false } })).toBe(false);
  });

  test('编辑按钮: 选中后 emit edit-data-source', () => {
    const eventBus = { emit: vi.fn() };
    const { result } = mountHook(eventBus);
    result.nodeContentMenuHandler({ preventDefault: vi.fn() } as any, { type: 'ds', id: 'd1' } as any);
    (result.menuData[0] as any).handler({});
    expect(eventBus.emit).toHaveBeenCalledWith('edit-data-source', 'd1');
  });

  test('编辑按钮: 未选中时不触发', () => {
    const eventBus = { emit: vi.fn() };
    const { result } = mountHook(eventBus);
    (result.menuData[0] as any).handler({});
    expect(eventBus.emit).not.toHaveBeenCalled();
  });

  test('复制按钮: 调用 add 并使用克隆数据', () => {
    const { result } = mountHook();
    result.nodeContentMenuHandler({ preventDefault: vi.fn() } as any, { type: 'ds', id: 'd1' } as any);
    const dataSourceService = {
      getDataSourceById: vi.fn(() => ({ name: 'a' })),
      add: vi.fn(),
    };
    (result.menuData[1] as any).handler({ dataSourceService });
    expect(dataSourceService.add).toHaveBeenCalledWith({ name: 'a' }, { historySource: 'tree-contextmenu' });
  });

  test('复制按钮: 未选中时不触发', () => {
    const { result } = mountHook();
    const dataSourceService = { getDataSourceById: vi.fn(), add: vi.fn() };
    (result.menuData[1] as any).handler({ dataSourceService });
    expect(dataSourceService.add).not.toHaveBeenCalled();
  });

  test('复制按钮: 找不到 ds 直接返回', () => {
    const { result } = mountHook();
    result.nodeContentMenuHandler({ preventDefault: vi.fn() } as any, { type: 'ds', id: 'd1' } as any);
    const dataSourceService = { getDataSourceById: vi.fn(() => null), add: vi.fn() };
    (result.menuData[1] as any).handler({ dataSourceService });
    expect(dataSourceService.add).not.toHaveBeenCalled();
  });

  test('删除按钮: emit remove-data-source', () => {
    const eventBus = { emit: vi.fn() };
    const { result } = mountHook(eventBus);
    result.nodeContentMenuHandler({ preventDefault: vi.fn() } as any, { type: 'ds', id: 'd1' } as any);
    (result.menuData[2] as any).handler({});
    expect(eventBus.emit).toHaveBeenCalledWith('remove-data-source', 'd1');
  });

  test('删除按钮: 未选中时不触发', () => {
    const eventBus = { emit: vi.fn() };
    const { result } = mountHook(eventBus);
    (result.menuData[2] as any).handler({});
    expect(eventBus.emit).not.toHaveBeenCalled();
  });

  test('nodeContentMenuHandler: 非 ds 类型不显示菜单', () => {
    const eventBus = { emit: vi.fn() };
    const { result } = mountHook(eventBus);
    const event = { preventDefault: vi.fn() };
    result.nodeContentMenuHandler(event as any, { type: 'other', id: 'a' } as any);
    expect(event.preventDefault).toHaveBeenCalled();
    (result.menuData[2] as any).handler({});
    expect(eventBus.emit).not.toHaveBeenCalled();
  });

  test('contentMenuHideHandler 重置 selectId', () => {
    const eventBus = { emit: vi.fn() };
    const { result } = mountHook(eventBus);
    result.nodeContentMenuHandler({ preventDefault: vi.fn() } as any, { type: 'ds', id: 'd1' } as any);
    result.contentMenuHideHandler();
    (result.menuData[2] as any).handler({});
    expect(eventBus.emit).not.toHaveBeenCalled();
  });

  test('nodeContentMenuHandler: data.id 缺失时 selectId=空', () => {
    const eventBus = { emit: vi.fn() };
    const { result } = mountHook(eventBus);
    result.nodeContentMenuHandler({ preventDefault: vi.fn() } as any, { type: 'ds' } as any);
    (result.menuData[2] as any).handler({});
    expect(eventBus.emit).not.toHaveBeenCalled();
  });

  test('getTarget 返回当前右键目标', () => {
    const { result } = mountHook();
    expect(result.getTarget()).toBeNull();

    result.nodeContentMenuHandler({ preventDefault: vi.fn() } as any, { type: 'ds', id: 'd1', name: 'ds1' } as any);
    expect(result.getTarget()).toEqual({ id: 'd1', data: { type: 'ds', id: 'd1', name: 'ds1' } });

    result.contentMenuHideHandler();
    expect(result.getTarget()).toBeNull();
  });
});
