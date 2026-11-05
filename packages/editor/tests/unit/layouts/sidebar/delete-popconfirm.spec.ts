/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import { setDesignConfig } from '@tmagic/design';

import CodeBlockList from '@editor/layouts/sidebar/code-block/CodeBlockList.vue';
import DataSourceList from '@editor/layouts/sidebar/data-source/DataSourceList.vue';

import elementPlusAdapter from '../../../../../element-plus-adapter/src/index';

setDesignConfig(elementPlusAdapter);

const editorService = {
  get: vi.fn((key: string) => (key === 'root' ? { items: [{ id: 'p1', name: 'page1' }] } : null)),
  select: vi.fn(),
};
const depService = {
  getTargets: vi.fn(() => ({})),
  getTarget: vi.fn(() => null),
};
const dataSourceService = {
  get: vi.fn((key: string) => {
    if (key === 'editable') return true;
    if (key === 'dataSources') return [{ id: 'd1', title: 'D1' }];
    return null;
  }),
};
const codeBlockService = {
  getCodeDsl: vi.fn(() => ({ c1: { name: 'C1' } })),
  getCodeContentById: vi.fn(),
  getEditStatus: vi.fn(() => true),
  getUndeletableList: vi.fn(() => []),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService, depService, dataSourceService, codeBlockService }),
}));

/** 点击 Popconfirm 的确认按钮（Element Plus 默认文案为 Yes） */
const clickConfirm = async () => {
  await vi.waitFor(() => {
    expect(document.body.textContent).toContain('Yes');
  });
  const confirmBtn = Array.from(document.querySelectorAll('button')).find(
    (btn) => btn.textContent?.trim().toLowerCase() === 'yes',
  );
  confirmBtn?.click();
};

/** 删除图标外层还有 Tooltip，需按文案定位 Popconfirm 自己的浮层 */
const getPopconfirmPopper = (text: string) =>
  Array.from(document.querySelectorAll('.el-popper')).find((el) => (el.textContent || '').includes(text));

/** 浮层需挂载到 body，且 placement 真正作用到 popper 上 */
const expectRightPlacement = async (wrapper: { element: Element }, text: string) => {
  await vi.waitFor(() => {
    expect(getPopconfirmPopper(text)?.getAttribute('data-popper-placement')).toBe('right');
  });
  const popper = getPopconfirmPopper(text);
  expect(popper).toBeTruthy();
  expect(wrapper.element.contains(popper!)).toBe(false);
};

describe('侧栏删除 Popconfirm（真实 element-plus）', () => {
  test('数据源：点击删除图标弹出 Popconfirm，确认后 emit remove', async () => {
    const wrapper = mount(DataSourceList, { attachTo: document.body });

    await wrapper.findAll('.edit-icon')[1].trigger('click');
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('确定删除?');
    });
    await expectRightPlacement(wrapper, '确定删除?');
    expect(wrapper.emitted('remove')).toBeFalsy();

    await clickConfirm();
    await vi.waitFor(() => {
      expect(wrapper.emitted('remove')?.[0]?.[0]).toBe('d1');
    });

    wrapper.unmount();
  });

  test('代码块：点击删除图标弹出 Popconfirm，确认后 emit remove', async () => {
    const wrapper = mount(CodeBlockList, { attachTo: document.body });

    await wrapper.findAll('.edit-icon')[1].trigger('click');
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('确定删除该代码块吗？');
    });
    await expectRightPlacement(wrapper, '确定删除该代码块吗？');
    expect(wrapper.emitted('remove')).toBeFalsy();

    await clickConfirm();
    await vi.waitFor(() => {
      expect(wrapper.emitted('remove')?.[0]?.[0]).toBe('c1');
    });

    wrapper.unmount();
  });
});
