/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { useDataSourceEdit } from '@editor/hooks/use-data-source-edit';

vi.mock('@editor/layouts/sidebar/data-source/DataSourceConfigPanel.vue', () => ({
  default: { name: 'DataSourceConfigPanelStub', render: () => h('div') },
}));

const mountHook = (dataSourceService: any) => {
  let captured: any;
  const comp = defineComponent({
    setup() {
      captured = useDataSourceEdit(dataSourceService);
      return () => h('div');
    },
  });
  mount(comp);
  return captured;
};

describe('useDataSourceEdit', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("editable 取自 dataSourceService.get('editable')", () => {
    const ds: any = {
      get: vi.fn((k: string) => (k === 'editable' ? false : undefined)),
      getDataSourceById: vi.fn(),
    };
    const hook = mountHook(ds);
    expect(hook.editable.value).toBe(false);
  });

  test('editHandler - editDialog 未就绪时直接返回', () => {
    const ds: any = {
      get: vi.fn(() => true),
      getDataSourceById: vi.fn(),
    };
    const hook = mountHook(ds);
    hook.editDialog.value = undefined;
    hook.editHandler('id1');
    expect(ds.getDataSourceById).not.toHaveBeenCalled();
  });

  test('editHandler 加载数据源并显示弹窗', () => {
    const ds: any = {
      get: vi.fn(() => true),
      getDataSourceById: vi.fn(() => ({ id: 'id1', title: 'T' })),
    };
    const hook = mountHook(ds);
    const show = vi.fn();
    hook.editDialog.value = { show } as any;
    hook.editHandler('id1');
    expect(hook.dataSourceValues.value).toMatchObject({ id: 'id1', title: 'T' });
    expect(hook.dialogTitle.value).toBe('编辑T');
    expect(show).toHaveBeenCalled();
  });

  test('editHandler - 数据源不存在时使用空对象，title 不带名称', () => {
    const ds: any = {
      get: vi.fn(() => true),
      getDataSourceById: vi.fn(() => null),
    };
    const hook = mountHook(ds);
    hook.editDialog.value = { show: vi.fn() } as any;
    hook.editHandler('xx');
    expect(hook.dialogTitle.value).toBe('编辑');
  });

  test('submitDataSourceHandler - 已存在 id 时调用 update', () => {
    const ds: any = {
      get: vi.fn(() => true),
      update: vi.fn(),
      add: vi.fn(),
    };
    const hook = mountHook(ds);
    const hide = vi.fn();
    hook.editDialog.value = { hide } as any;
    hook.submitDataSourceHandler({ id: 'i' } as any, { changeRecords: [] } as any);
    expect(ds.update).toHaveBeenCalled();
    expect(ds.add).not.toHaveBeenCalled();
    expect(hide).toHaveBeenCalled();
  });

  test('submitDataSourceHandler - 没有 id 时调用 add', () => {
    const ds: any = {
      get: vi.fn(() => true),
      update: vi.fn(),
      add: vi.fn(),
    };
    const hook = mountHook(ds);
    hook.editDialog.value = { hide: vi.fn() } as any;
    hook.submitDataSourceHandler({} as any, {} as any);
    expect(ds.add).toHaveBeenCalled();
    expect(ds.update).not.toHaveBeenCalled();
  });
});
