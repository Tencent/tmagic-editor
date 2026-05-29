/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import historyService from '@editor/services/history';

const editorService = { gotoPageStep: vi.fn(async () => 0) };
const dataSourceService = { goto: vi.fn(() => 0) };
const codeBlockService = { goto: vi.fn(async () => 0) };

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ historyService, editorService, dataSourceService, codeBlockService }),
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

// 差异对话框有独立的单测（HistoryDiffDialog.spec.ts），这里 stub 掉以隔离面板自身逻辑，
// 同时避免其内部依赖（monaco CodeEditor / CompareForm / 设计层弹窗组件）在本用例下未被 mock 而报错。
vi.mock('@editor/layouts/history-list/HistoryDiffDialog.vue', () => ({
  default: defineComponent({
    name: 'FakeHistoryDiffDialog',
    setup(_p, { expose }) {
      expose({ open: vi.fn(), close: vi.fn() });
      return () => h('div', { class: 'fake-history-diff-dialog' });
    },
  }),
}));

afterEach(() => {
  historyService.reset();
  vi.clearAllMocks();
});

const factory = async () => {
  const { default: historyListPanel } = await import('@editor/layouts/history-list/HistoryListPanel.vue');
  return mount(historyListPanel, { attachTo: document.body });
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

  test('点击合并组头部能切换 expanded 状态（不触发 goto）', async () => {
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
    // 合并组头部点击不应触发 goto
    expect(editorService.gotoPageStep).not.toHaveBeenCalled();
    // 再点击折叠
    await wrapper.find('.m-editor-history-list-group-head').trigger('click');
    expect(wrapper.find('.m-editor-history-list-substeps').exists()).toBe(false);
  });

  test('点击页面 group 头部调用 editorService.gotoPageStep', async () => {
    historyService.changePage({ id: 'p1' } as any);
    historyService.push({
      opType: 'add',
      nodes: [{ id: 'n1', name: 'A' }],
      modifiedNodeIds: new Map(),
    } as any);
    historyService.push({
      opType: 'add',
      nodes: [{ id: 'n2', name: 'B' }],
      modifiedNodeIds: new Map(),
    } as any);

    const wrapper = await factory();
    await nextTick();

    // 第一组（页面 tab，倒序：最新一组在前，对应 step.index = 1）
    const head = wrapper.find('.m-editor-history-list-group-head');
    // 当前组（最新一组）属于 isCurrent=true，点击不会触发 goto；改点第二组
    const heads = wrapper.findAll('.m-editor-history-list-group-head');
    expect(heads.length).toBeGreaterThanOrEqual(2);
    // 第二行（pg-1）对应原始 step.index = 0；cursor 应为 0+1 = 1
    await heads[1].trigger('click');
    expect(editorService.gotoPageStep).toHaveBeenCalledTimes(1);
    expect(editorService.gotoPageStep).toHaveBeenCalledWith(1);

    // 当前组点击不触发 goto
    await head.trigger('click');
    expect(editorService.gotoPageStep).toHaveBeenCalledTimes(1);
  });

  test('点击数据源组头部调用 dataSourceService.goto(id, cursor)', async () => {
    historyService.pushDataSource('ds_1', {
      oldSchema: null,
      newSchema: { id: 'ds_1', title: 'DS' } as any,
    });

    const wrapper = await factory();
    await nextTick();

    // 当前 ds 组（isCurrent）点击不触发 goto；为了能触发，先撤销该步使其变为非当前
    historyService.undoDataSource('ds_1');
    await nextTick();

    const heads = wrapper.findAll('.m-editor-history-list-group-head');
    // 找到数据源 tab 那一组
    const dsHead = heads.find((h) => h.text().includes('创建 DS'));
    expect(dsHead).toBeTruthy();
    await dsHead!.trigger('click');
    expect(dataSourceService.goto).toHaveBeenCalledWith('ds_1', 1);
  });

  test('点击代码块组头部调用 codeBlockService.goto(id, cursor)', async () => {
    historyService.pushCodeBlock('code_1', {
      oldContent: null,
      newContent: { id: 'code_1', name: 'CB' } as any,
    });

    const wrapper = await factory();
    await nextTick();

    historyService.undoCodeBlock('code_1');
    await nextTick();

    const heads = wrapper.findAll('.m-editor-history-list-group-head');
    const cbHead = heads.find((h) => h.text().includes('创建 CB'));
    expect(cbHead).toBeTruthy();
    await cbHead!.trigger('click');
    expect(codeBlockService.goto).toHaveBeenCalledWith('code_1', 1);
  });

  test('点击页面初始项调用 editorService.gotoPageStep(0)', async () => {
    historyService.changePage({ id: 'p1' } as any);
    historyService.push({
      opType: 'add',
      nodes: [{ id: 'n1', name: 'A' }],
      modifiedNodeIds: new Map(),
    } as any);

    const wrapper = await factory();
    await nextTick();

    // 页面 tab 列表底部应有初始项
    const initials = wrapper.findAll('.m-editor-history-list-initial');
    expect(initials.length).toBeGreaterThanOrEqual(1);
    // 第一项（页面 tab）应为页面 tab 的初始项；page tab 在三个 tab 中最先渲染
    await initials[0].trigger('click');
    expect(editorService.gotoPageStep).toHaveBeenCalledWith(0);
  });

  test('点击数据源/代码块初始项调用对应 service.goto(id, 0)', async () => {
    historyService.pushDataSource('ds_x', {
      oldSchema: null,
      newSchema: { id: 'ds_x', title: 'DS' } as any,
    });
    historyService.pushCodeBlock('code_x', {
      oldContent: null,
      newContent: { id: 'code_x', name: 'CB' } as any,
    });

    const wrapper = await factory();
    await nextTick();

    // 三个 tab 都内容齐全：page tab 因没有 page push 是空态，没有初始项；
    // ds tab 与 cb tab 各 1 个 bucket → 各 1 条初始项
    const initials = wrapper.findAll('.m-editor-history-list-initial');
    expect(initials).toHaveLength(2);

    // 顺序：tab 渲染顺序是 page → data-source → code-block
    // 因此 initials[0] 属于 ds_x，initials[1] 属于 code_x
    await initials[0].trigger('click');
    expect(dataSourceService.goto).toHaveBeenCalledWith('ds_x', 0);

    await initials[1].trigger('click');
    expect(codeBlockService.goto).toHaveBeenCalledWith('code_x', 0);
  });
});
