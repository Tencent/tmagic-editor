/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import historyService from '@editor/services/history';

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ historyService }),
}));

vi.mock('@tmagic/design', () => ({
  getDesignConfig: vi.fn(() => undefined),
  TMagicButton: defineComponent({
    name: 'FakeButton',
    setup(_p, { slots }) {
      return () => h('button', { class: 'fake-btn' }, [slots.icon?.(), slots.default?.()]);
    },
  }),
  TMagicPopover: defineComponent({
    name: 'FakePopover',
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-popover' }, [slots.reference?.(), slots.default?.()]);
    },
  }),
  TMagicTabs: defineComponent({
    name: 'FakeTabs',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-tabs' }, slots.default?.());
    },
  }),
  TMagicTooltip: defineComponent({
    name: 'FakeTooltip',
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-tooltip' }, slots.default?.());
    },
  }),
  TMagicScrollbar: defineComponent({
    name: 'FakeScrollbar',
    props: ['maxHeight'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-scrollbar' }, slots.default?.());
    },
  }),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({
    name: 'FakeIcon',
    props: ['icon'],
    setup() {
      return () => h('i', { class: 'fake-icon' });
    },
  }),
}));

afterEach(() => {
  historyService.reset();
  vi.clearAllMocks();
});

const factory = async () => {
  const { default: HistoryListPanel } = await import('@editor/layouts/history-list/HistoryListPanel.vue');
  return mount(HistoryListPanel, { attachTo: document.body });
};

describe('HistoryListPanel.vue', () => {
  test('挂载渲染：tab 数量为 0 时三个 tab 标签都显示 (0)', async () => {
    const wrapper = await factory();
    await nextTick();
    expect(wrapper.find('.fake-popover').exists()).toBe(true);
    // 由于 fake tab-pane 的回退是 el-tab-pane（无组件），label 显示在 tab 容器里
    // 三个 tab 的 default slot 都会被渲染（fake tabs 仅是包裹层），可以看到三个空态
    const empties = wrapper.findAll('.m-editor-history-list-empty');
    expect(empties).toHaveLength(3);
  });

  test('页面/数据源/代码块 数据齐全时各 tab 渲染对应内容', async () => {
    historyService.changePage({ id: 'p1' } as any);
    historyService.push({
      opType: 'add',
      nodes: [{ id: 'n1', name: 'A' }],
      modifiedNodeIds: new Map(),
    } as any);
    historyService.pushDataSource('ds_1', {
      oldSchema: null,
      newSchema: { id: 'ds_1', title: 'DS' } as any,
    });
    historyService.pushCodeBlock('code_1', {
      oldContent: null,
      newContent: { id: 'code_1', name: 'CB' } as any,
    });

    const wrapper = await factory();
    await nextTick();

    const rows = wrapper.findAll('.m-editor-history-list-group');
    // 三个 tab 各一条记录
    expect(rows.length).toBe(3);

    const descs = rows.map((r) => r.find('.m-editor-history-list-item-desc').text());
    expect(descs.some((t) => t.includes('新增 1 个节点'))).toBe(true);
    expect(descs.some((t) => t === '创建 DS (id: ds_1)')).toBe(true);
    expect(descs.some((t) => t === '创建 CB (id: code_1)')).toBe(true);
  });

  test('点击合并组头部能切换 expanded 状态', async () => {
    historyService.changePage({ id: 'p1' } as any);
    // 推两个修改同一节点的步骤，会合并为一个 group
    const mkUpdate = (path: string) => ({
      opType: 'update',
      modifiedNodeIds: new Map(),
      updatedItems: [
        {
          newNode: { id: 'btn', name: '按钮' },
          oldNode: { id: 'btn', name: '按钮' },
          changeRecords: [{ propPath: path }],
        },
      ],
    });
    historyService.push(mkUpdate('a') as any);
    historyService.push(mkUpdate('b') as any);

    const wrapper = await factory();
    await nextTick();

    const head = wrapper.find('.m-editor-history-list-group-head');
    expect(head.exists()).toBe(true);
    // 默认未展开
    expect(wrapper.find('.m-editor-history-list-substeps').exists()).toBe(false);
    // 点击展开
    await head.trigger('click');
    expect(wrapper.find('.m-editor-history-list-substeps').exists()).toBe(true);
    expect(wrapper.findAll('.m-editor-history-list-substeps li')).toHaveLength(2);
    // 再点击折叠
    await head.trigger('click');
    expect(wrapper.find('.m-editor-history-list-substeps').exists()).toBe(false);
  });
});
