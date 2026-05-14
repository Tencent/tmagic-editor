/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { useContentMenu } from '@editor/layouts/sidebar/code-block/useContentMenu';

const MenuStub = defineComponent({
  name: 'ContentMenu',
  setup(_, { expose }) {
    expose({ show: vi.fn(), hide: vi.fn() });
    return () => h('div');
  },
});

const mountHook = (deleteCode: any, eventBus: any = { emit: vi.fn() }) => {
  let result: ReturnType<typeof useContentMenu> | undefined;
  const hostComp = defineComponent({
    components: { MenuStub },
    setup(_, { expose }) {
      result = useContentMenu(deleteCode);
      expose({ result });
      return () => h(MenuStub, { ref: 'menu' });
    },
  });
  const wrapper = mount(hostComp, { global: { provide: { eventBus } } });
  return { wrapper, result: result!, eventBus };
};

describe('code-block useContentMenu', () => {
  test('提供 menuData 和处理函数', () => {
    const { result } = mountHook(vi.fn());
    expect(result.menuData.length).toBe(3);
    expect(typeof result.nodeContentMenuHandler).toBe('function');
    expect(typeof result.contentMenuHideHandler).toBe('function');
  });

  test('编辑按钮 display 取决于 codeBlockService.getEditStatus()', () => {
    const { result } = mountHook(vi.fn());
    const editBtn = result.menuData[0] as any;
    expect(editBtn.display({ codeBlockService: { getEditStatus: () => true } })).toBe(true);
    expect(editBtn.display({ codeBlockService: { getEditStatus: () => false } })).toBe(false);
  });

  test('编辑按钮: 选中后 emit edit-code', () => {
    const eventBus = { emit: vi.fn() };
    const { result } = mountHook(vi.fn(), eventBus);
    result.nodeContentMenuHandler({ preventDefault: vi.fn() } as any, { type: 'code', id: 'c1' } as any);
    (result.menuData[0] as any).handler({});
    expect(eventBus.emit).toHaveBeenCalledWith('edit-code', 'c1');
  });

  test('编辑按钮: 未选中时不触发', () => {
    const eventBus = { emit: vi.fn() };
    const { result } = mountHook(vi.fn(), eventBus);
    (result.menuData[0] as any).handler({});
    expect(eventBus.emit).not.toHaveBeenCalled();
  });

  test('复制按钮: 调用 setCodeDslById 并使用克隆数据', async () => {
    const { result } = mountHook(vi.fn());
    result.nodeContentMenuHandler({ preventDefault: vi.fn() } as any, { type: 'code', id: 'c1' } as any);
    const codeBlockService = {
      getCodeContentById: vi.fn(() => ({ name: 'a' })),
      getUniqueId: vi.fn(async () => 'newId'),
      setCodeDslById: vi.fn(),
    };
    await (result.menuData[1] as any).handler({ codeBlockService });
    expect(codeBlockService.setCodeDslById).toHaveBeenCalledWith('newId', { name: 'a' });
  });

  test('复制按钮: 未选中时不触发', async () => {
    const { result } = mountHook(vi.fn());
    const codeBlockService = {
      getCodeContentById: vi.fn(),
      getUniqueId: vi.fn(),
      setCodeDslById: vi.fn(),
    };
    await (result.menuData[1] as any).handler({ codeBlockService });
    expect(codeBlockService.getCodeContentById).not.toHaveBeenCalled();
  });

  test('复制按钮: 找不到 codeBlock 直接返回', async () => {
    const { result } = mountHook(vi.fn());
    result.nodeContentMenuHandler({ preventDefault: vi.fn() } as any, { type: 'code', id: 'c1' } as any);
    const codeBlockService = {
      getCodeContentById: vi.fn(() => null),
      getUniqueId: vi.fn(),
      setCodeDslById: vi.fn(),
    };
    await (result.menuData[1] as any).handler({ codeBlockService });
    expect(codeBlockService.setCodeDslById).not.toHaveBeenCalled();
  });

  test('删除按钮: 调用传入的 deleteCode', () => {
    const deleteCode = vi.fn();
    const { result } = mountHook(deleteCode);
    result.nodeContentMenuHandler({ preventDefault: vi.fn() } as any, { type: 'code', id: 'c1' } as any);
    (result.menuData[2] as any).handler({});
    expect(deleteCode).toHaveBeenCalledWith('c1');
  });

  test('nodeContentMenuHandler: 非 code 类型不显示菜单', () => {
    const { result } = mountHook(vi.fn());
    const event = { preventDefault: vi.fn() };
    result.nodeContentMenuHandler(event as any, { type: 'other' } as any);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  test('contentMenuHideHandler 重置 selectId', () => {
    const deleteCode = vi.fn();
    const { result } = mountHook(deleteCode);
    result.nodeContentMenuHandler({ preventDefault: vi.fn() } as any, { type: 'code', id: 'c1' } as any);
    result.contentMenuHideHandler();
    (result.menuData[2] as any).handler({});
    expect(deleteCode).not.toHaveBeenCalled();
  });

  test('nodeContentMenuHandler: data.id 缺失时 selectId=空', () => {
    const deleteCode = vi.fn();
    const { result } = mountHook(deleteCode);
    result.nodeContentMenuHandler({ preventDefault: vi.fn() } as any, { type: 'code' } as any);
    (result.menuData[2] as any).handler({});
    expect(deleteCode).not.toHaveBeenCalled();
  });
});
