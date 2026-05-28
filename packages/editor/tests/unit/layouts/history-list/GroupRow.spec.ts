/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { mount } from '@vue/test-utils';

import GroupRow from '@editor/layouts/history-list/GroupRow.vue';

const baseProps = {
  groupKey: 'pg-0',
  applied: true,
  merged: false,
  opType: 'update' as const,
  desc: '修改 按钮',
  stepCount: 1,
  subSteps: [] as { index: number; applied: boolean; desc: string }[],
  expanded: false,
};

describe('GroupRow.vue', () => {
  test('渲染描述与操作类型徽标（update→修改）', () => {
    const wrapper = mount(GroupRow, { props: baseProps });
    expect(wrapper.find('.m-editor-history-list-item-desc').text()).toBe('修改 按钮');
    const op = wrapper.find('.m-editor-history-list-item-op');
    expect(op.text()).toBe('修改');
    expect(op.classes()).toContain('op-update');
  });

  test('add / remove 操作徽标使用对应类名与文案', () => {
    const w1 = mount(GroupRow, { props: { ...baseProps, opType: 'add' } });
    expect(w1.find('.m-editor-history-list-item-op').text()).toBe('新增');
    expect(w1.find('.m-editor-history-list-item-op').classes()).toContain('op-add');

    const w2 = mount(GroupRow, { props: { ...baseProps, opType: 'remove' } });
    expect(w2.find('.m-editor-history-list-item-op').text()).toBe('删除');
    expect(w2.find('.m-editor-history-list-item-op').classes()).toContain('op-remove');
  });

  test('applied=false 时附加 is-undone 类名', () => {
    const wrapper = mount(GroupRow, { props: { ...baseProps, applied: false } });
    expect(wrapper.find('.m-editor-history-list-group').classes()).toContain('is-undone');
  });

  test('merged=true 时显示「合并 N 步」并附 is-merged 类名', () => {
    const wrapper = mount(GroupRow, {
      props: { ...baseProps, merged: true, stepCount: 3 },
    });
    expect(wrapper.find('.m-editor-history-list-group').classes()).toContain('is-merged');
    expect(wrapper.find('.m-editor-history-list-item-merge').text()).toBe('合并 3 步');
  });

  test('未合并时不渲染合并标记', () => {
    const wrapper = mount(GroupRow, { props: baseProps });
    expect(wrapper.find('.m-editor-history-list-item-merge').exists()).toBe(false);
  });

  test('merged=true 且 expanded=true 时渲染子步列表', () => {
    const wrapper = mount(GroupRow, {
      props: {
        ...baseProps,
        merged: true,
        stepCount: 2,
        expanded: true,
        subSteps: [
          { index: 0, applied: true, desc: '修改 颜色' },
          { index: 1, applied: false, desc: '修改 字号' },
        ],
      },
    });
    const items = wrapper.findAll('.m-editor-history-list-substeps li');
    expect(items).toHaveLength(2);
    expect(items[0].text()).toContain('#1');
    expect(items[0].text()).toContain('修改 颜色');
    expect(items[1].text()).toContain('#2');
    expect(items[1].text()).toContain('修改 字号');
    // 第二个子步未应用
    expect(items[1].classes()).toContain('is-undone');
  });

  test('merged=true 但 expanded=false 时不渲染子步列表', () => {
    const wrapper = mount(GroupRow, {
      props: {
        ...baseProps,
        merged: true,
        stepCount: 2,
        expanded: false,
        subSteps: [{ index: 0, applied: true, desc: 'x' }],
      },
    });
    expect(wrapper.find('.m-editor-history-list-substeps').exists()).toBe(false);
  });

  test('点击头部触发 toggle 事件并携带 groupKey', async () => {
    const wrapper = mount(GroupRow, { props: baseProps });
    await wrapper.find('.m-editor-history-list-group-head').trigger('click');
    const events = wrapper.emitted('toggle');
    expect(events).toBeTruthy();
    expect(events![0]).toEqual(['pg-0']);
  });
});
