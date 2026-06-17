/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import historyService from '@editor/services/history';

const { diffDialogOpen, confirmDialogConfirm } = vi.hoisted(() => ({
  diffDialogOpen: vi.fn(),
  confirmDialogConfirm: vi.fn(async () => true),
}));

const stageSelect = vi.fn();
const overlayStageSelect = vi.fn();
const editorService = {
  gotoPageStep: vi.fn(async () => 0),
  revertPageStep: vi.fn(async () => null),
  getNodeById: vi.fn((id: string | number) => ({ id })),
  select: vi.fn(async () => {}),
  get: vi.fn(() => ({ select: stageSelect })),
};
const stageOverlayService = { get: vi.fn(() => ({ select: overlayStageSelect })) };
const dataSourceService = {
  goto: vi.fn(() => 0),
  revert: vi.fn(async () => null),
  getDataSourceById: vi.fn((id: string) => ({ id, title: 'DS' })),
};
const codeBlockService = {
  goto: vi.fn(async () => 0),
  revert: vi.fn(async () => null),
  getCodeContentById: vi.fn((id: string | number) => ({ id, name: 'CB' })),
};
const propsService = {
  getDisabledDataSource: vi.fn(() => false),
  getDisabledCodeBlock: vi.fn(() => false),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({
    historyService,
    editorService,
    dataSourceService,
    codeBlockService,
    propsService,
    stageOverlayService,
  }),
}));

vi.mock('@tmagic/design', () => ({
  getDesignConfig: vi.fn(() => undefined),
  tMagicMessage: { warning: vi.fn(), error: vi.fn(), success: vi.fn() },
  tMagicMessageBox: { confirm: vi.fn(async () => undefined) },
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
      expose({ open: diffDialogOpen, close: vi.fn(), confirm: confirmDialogConfirm });
      return () => h('div', { class: 'fake-history-diff-dialog' });
    },
  }),
}));

afterEach(() => {
  historyService.reset();
  vi.clearAllMocks();
  propsService.getDisabledDataSource.mockReturnValue(false);
  propsService.getDisabledCodeBlock.mockReturnValue(false);
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
      diff: [{ newSchema: { id: 'n1', name: 'A' } }],
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
    expect(descs.some((t) => t === 'A (id: n1)')).toBe(true);
    expect(descs.some((t) => t === 'DS (id: ds_1)')).toBe(true);
    expect(descs.some((t) => t === 'CB (id: code_1)')).toBe(true);
  });

  test('点击合并组头部能切换 expanded 状态（不触发 goto）', async () => {
    historyService.changePage({ id: 'p1' } as any);
    // 推两个修改同一节点的步骤，会合并为一个 group
    const mkUpdate = (path: string) => ({
      opType: 'update',
      modifiedNodeIds: new Map(),
      diff: [
        {
          newSchema: { id: 'btn', name: '按钮' },
          oldSchema: { id: 'btn', name: '按钮' },
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
    // 默认展开
    expect(wrapper.find('.m-editor-history-list-substeps').exists()).toBe(true);
    expect(wrapper.findAll('.m-editor-history-list-substeps li')).toHaveLength(2);
    // 合并组头部点击不应触发 goto
    expect(editorService.gotoPageStep).not.toHaveBeenCalled();
    // 点击收起
    await head.trigger('click');
    expect(wrapper.find('.m-editor-history-list-substeps').exists()).toBe(false);
    // 再点击展开
    await wrapper.find('.m-editor-history-list-group-head').trigger('click');
    expect(wrapper.find('.m-editor-history-list-substeps').exists()).toBe(true);
  });

  test('点击页面 group 头部调用 editorService.gotoPageStep', async () => {
    historyService.changePage({ id: 'p1' } as any);
    historyService.push({
      opType: 'add',
      diff: [{ newSchema: { id: 'n1', name: 'A' } }],
      modifiedNodeIds: new Map(),
    } as any);
    historyService.push({
      opType: 'add',
      diff: [{ newSchema: { id: 'n2', name: 'B' } }],
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
    await heads[1].find('.m-editor-history-list-item-goto').trigger('click');
    expect(editorService.gotoPageStep).toHaveBeenCalledTimes(1);
    expect(editorService.gotoPageStep).toHaveBeenCalledWith(1);

    // 当前组没有「回到」按钮，点击头部不触发 goto
    await head.trigger('click');
    expect(editorService.gotoPageStep).toHaveBeenCalledTimes(1);
  });

  test('点击页面 group 头部选中对应节点（editorService.select + 画布 select 联动）', async () => {
    historyService.changePage({ id: 'p1' } as any);
    historyService.push({
      opType: 'add',
      diff: [{ newSchema: { id: 'n1', name: 'A' } }],
      modifiedNodeIds: new Map(),
    } as any);

    const wrapper = await factory();
    await nextTick();

    const head = wrapper.find('.m-editor-history-list-group-head');
    await head.trigger('click');
    await nextTick();

    expect(editorService.getNodeById).toHaveBeenCalledWith('n1', false);
    expect(editorService.select).toHaveBeenCalledWith({ id: 'n1' });
    expect(stageSelect).toHaveBeenCalledWith('n1');
    expect(overlayStageSelect).toHaveBeenCalledWith('n1');
    // 选中不应触发跳转
    expect(editorService.gotoPageStep).not.toHaveBeenCalled();
  });

  test('点击页面记录时节点已不存在则提示且不选中', async () => {
    historyService.changePage({ id: 'p1' } as any);
    historyService.push({
      opType: 'remove',
      diff: [{ oldSchema: { id: 'gone', name: 'G' } }],
      modifiedNodeIds: new Map(),
    } as any);
    editorService.getNodeById.mockReturnValueOnce(null);

    const { tMagicMessage } = await import('@tmagic/design');
    const wrapper = await factory();
    await nextTick();

    await wrapper.find('.m-editor-history-list-group-head').trigger('click');
    await nextTick();

    expect(tMagicMessage.warning).toHaveBeenCalled();
    expect(editorService.select).not.toHaveBeenCalled();
    expect(stageSelect).not.toHaveBeenCalled();
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
    const dsHead = heads.find((h) => h.text().includes('DS (id: ds_1)'));
    expect(dsHead).toBeTruthy();
    await dsHead!.find('.m-editor-history-list-item-goto').trigger('click');
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
    const cbHead = heads.find((h) => h.text().includes('CB (id: code_1)'));
    expect(cbHead).toBeTruthy();
    await cbHead!.find('.m-editor-history-list-item-goto').trigger('click');
    expect(codeBlockService.goto).toHaveBeenCalledWith('code_1', 1);
  });

  test('点击页面初始项调用 editorService.gotoPageStep(0)', async () => {
    historyService.changePage({ id: 'p1' } as any);
    historyService.push({
      opType: 'add',
      diff: [{ newSchema: { id: 'n1', name: 'A' } }],
      modifiedNodeIds: new Map(),
    } as any);

    const wrapper = await factory();
    await nextTick();

    // 页面 tab 列表底部应有初始项
    const initials = wrapper.findAll('.m-editor-history-list-initial');
    expect(initials.length).toBeGreaterThanOrEqual(1);
    // 第一项（页面 tab）应为页面 tab 的初始项；page tab 在三个 tab 中最先渲染
    await initials[0].find('.m-editor-history-list-item-goto').trigger('click');
    expect(editorService.gotoPageStep).toHaveBeenCalledWith(0);
  });

  test('注入 historyListExtraTabs 时追加渲染自定义 tab 内容组件', async () => {
    const { default: historyListPanel } = await import('@editor/layouts/history-list/HistoryListPanel.vue');
    const customTab = defineComponent({
      name: 'CustomHistoryTab',
      props: ['title'],
      setup(p) {
        return () => h('div', { class: 'custom-history-tab' }, p.title);
      },
    });

    const wrapper = mount(historyListPanel, {
      attachTo: document.body,
      global: {
        provide: {
          historyListExtraTabs: [
            {
              name: 'custom-module',
              label: () => '自定义模块 (1)',
              component: customTab,
              props: { title: 'hello-custom' },
            },
          ],
        },
      },
    });
    await nextTick();

    const custom = wrapper.find('.custom-history-tab');
    expect(custom.exists()).toBe(true);
    expect(custom.text()).toBe('hello-custom');
  });

  test('disabledDataSource / disabledCodeBlock 为 true 时不渲染对应 tab', async () => {
    propsService.getDisabledDataSource.mockReturnValue(true);
    propsService.getDisabledCodeBlock.mockReturnValue(true);

    const wrapper = await factory();
    await nextTick();

    const empties = wrapper.findAll('.m-editor-history-list-empty');
    expect(empties).toHaveLength(1);
  });

  test('点击页面 update 记录的「查看差异」打开 diff 弹窗', async () => {
    historyService.changePage({ id: 'p1' } as any);
    historyService.push({
      opType: 'update',
      modifiedNodeIds: new Map(),
      diff: [
        {
          newSchema: { id: 'btn', name: '新按钮', type: 'button' },
          oldSchema: { id: 'btn', name: '旧按钮', type: 'button' },
          changeRecords: [{ propPath: 'name' }],
        },
      ],
    } as any);

    const wrapper = await factory();
    await nextTick();

    await wrapper.find('.m-editor-history-list-item-diff').trigger('click');
    expect(diffDialogOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'node',
        targetLabel: '新按钮',
        value: expect.objectContaining({ name: '新按钮' }),
      }),
    );
  });

  test('点击页面 update 记录的「回滚」在确认后调用 revertPageStep', async () => {
    historyService.changePage({ id: 'p1' } as any);
    historyService.push({
      opType: 'update',
      modifiedNodeIds: new Map(),
      diff: [
        {
          newSchema: { id: 'btn', name: '新按钮', type: 'button' },
          oldSchema: { id: 'btn', name: '旧按钮', type: 'button' },
          changeRecords: [{ propPath: 'name' }],
        },
      ],
    } as any);

    const wrapper = await factory();
    await nextTick();

    await wrapper.find('.m-editor-history-list-item-revert').trigger('click');
    await nextTick();
    expect(confirmDialogConfirm).toHaveBeenCalled();
    expect(editorService.revertPageStep).toHaveBeenCalledWith(0);
  });

  test('回滚目标节点已删除时提示错误且不执行 revert', async () => {
    historyService.changePage({ id: 'p1' } as any);
    historyService.push({
      opType: 'update',
      modifiedNodeIds: new Map(),
      diff: [
        {
          newSchema: { id: 'gone', name: '按钮', type: 'button' },
          oldSchema: { id: 'gone', name: '按钮', type: 'button' },
          changeRecords: [{ propPath: 'name' }],
        },
      ],
    } as any);
    editorService.getNodeById.mockReturnValueOnce(null);

    const { tMagicMessage } = await import('@tmagic/design');
    const wrapper = await factory();
    await nextTick();

    await wrapper.find('.m-editor-history-list-item-revert').trigger('click');
    await nextTick();
    expect(tMagicMessage.error).toHaveBeenCalledWith('回滚失败：该记录对应的数据已被删除');
    expect(editorService.revertPageStep).not.toHaveBeenCalled();
  });

  test('确认清空页面历史后调用 historyService.clearPage', async () => {
    historyService.changePage({ id: 'p1' } as any);
    historyService.push({
      opType: 'add',
      diff: [{ newSchema: { id: 'n1', name: 'A' } }],
      modifiedNodeIds: new Map(),
    } as any);
    const saveSpy = vi.spyOn(historyService, 'saveToIndexedDB').mockResolvedValue(undefined);

    const wrapper = await factory();
    await nextTick();

    await wrapper.find('.m-editor-history-list-clear').trigger('click');
    await nextTick();

    expect(historyService.getPageHistoryGroups()).toHaveLength(0);
    expect(saveSpy).toHaveBeenCalled();
    saveSpy.mockRestore();
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
    await initials[0].find('.m-editor-history-list-item-goto').trigger('click');
    expect(dataSourceService.goto).toHaveBeenCalledWith('ds_x', 0);

    await initials[1].find('.m-editor-history-list-item-goto').trigger('click');
    expect(codeBlockService.goto).toHaveBeenCalledWith('code_x', 0);
  });

  test('点击数据源 update 记录的「查看差异」与「回滚」', async () => {
    historyService.pushDataSource('ds_1', {
      oldSchema: null,
      newSchema: { id: 'ds_1', title: 'DS' } as any,
    });
    historyService.pushDataSource('ds_1', {
      oldSchema: { id: 'ds_1', title: '旧 DS' } as any,
      newSchema: { id: 'ds_1', title: '新 DS' } as any,
      changeRecords: [{ propPath: 'title' }],
    });

    const wrapper = await factory();
    await nextTick();

    const diffBtn = wrapper.find('.m-editor-history-list-item-diff');
    await diffBtn.trigger('click');
    expect(diffDialogOpen).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'data-source', targetLabel: '新 DS' }),
    );

    await wrapper.find('.m-editor-history-list-item-revert').trigger('click');
    await nextTick();
    expect(confirmDialogConfirm).toHaveBeenCalled();
    expect(dataSourceService.revert).toHaveBeenCalledWith('ds_1', 1);
  });

  test('确认清空数据源/代码块历史后调用 clearDataSource / clearCodeBlock', async () => {
    historyService.pushDataSource('ds_1', {
      oldSchema: null,
      newSchema: { id: 'ds_1', title: 'DS' } as any,
    });
    historyService.pushCodeBlock('code_1', {
      oldContent: null,
      newContent: { id: 'code_1', name: 'CB' } as any,
    });
    const saveSpy = vi.spyOn(historyService, 'saveToIndexedDB').mockResolvedValue(undefined);

    const wrapper = await factory();
    await nextTick();

    const clears = wrapper.findAll('.m-editor-history-list-clear');
    expect(clears.length).toBeGreaterThanOrEqual(2);
    await clears[0].trigger('click');
    await nextTick();
    await clears[1].trigger('click');
    await nextTick();

    expect(historyService.getDataSourceHistoryGroups()).toHaveLength(0);
    expect(historyService.getCodeBlockHistoryGroups()).toHaveLength(0);
    expect(saveSpy).toHaveBeenCalled();
    saveSpy.mockRestore();
  });
});
