/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import CodeBlockList from '@editor/layouts/sidebar/code-block/CodeBlockList.vue';

const codeBlockService = {
  getCodeDsl: vi.fn(() => ({ c1: { name: 'C1' } })),
  getCodeContentById: vi.fn(),
  getEditStatus: vi.fn(() => true),
  getUndeletableList: vi.fn(() => []),
};
const editorService = {
  get: vi.fn(),
  select: vi.fn(),
};
const depService = {
  getTarget: vi.fn(() => null),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ codeBlockService, editorService, depService }),
}));

vi.mock('@editor/hooks/use-node-status', () => ({
  useNodeStatus: () => ({ nodeStatusMap: { value: new Map() } }),
}));

vi.mock('@editor/hooks/use-filter', () => ({
  useFilter: () => ({ filterTextChangeHandler: vi.fn() }),
}));

const { messageBoxConfirm, messageError } = vi.hoisted(() => ({
  messageBoxConfirm: vi.fn(async () => 'confirm'),
  messageError: vi.fn(),
}));

vi.mock('@tmagic/design', () => ({
  tMagicMessage: { error: messageError },
  tMagicMessageBox: { confirm: messageBoxConfirm },
  TMagicTooltip: defineComponent({
    name: 'TMagicTooltip',
    props: ['content', 'placement', 'effect'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-tooltip' }, slots.default?.());
    },
  }),
  TMagicPopconfirm: defineComponent({
    name: 'TMagicPopconfirm',
    props: ['title', 'placement', 'width'],
    emits: ['confirm', 'cancel'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-popconfirm' }, slots.reference?.());
    },
  }),
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    props: ['icon', 'link'],
    setup(_p, { slots, attrs }) {
      return () => h('button', { ...attrs, class: 'edit-icon' }, slots.default?.());
    },
  }),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({
    name: 'EditorIcon',
    props: ['icon'],
    emits: ['click'],
    setup(_p, { emit }) {
      return () => h('i', { class: 'edit-icon', onClick: (e: Event) => emit('click', e) });
    },
  }),
}));

vi.mock('@editor/components/Tree.vue', () => ({
  default: defineComponent({
    name: 'TreeStub',
    props: ['data', 'nodeStatusMap', 'indent', 'nextLevelIndentIncrement'],
    emits: ['node-click', 'node-contextmenu'],
    setup(_p, { emit, slots }) {
      return () =>
        h('div', { class: 'fake-tree' }, [
          h('button', {
            class: 'click-btn',
            onClick: () => emit('node-click', new MouseEvent('click'), { type: 'node', key: 'comp1' }),
          }),
          h('button', {
            class: 'menu-btn',
            onClick: () => emit('node-contextmenu', new MouseEvent('contextmenu'), { type: 'code', id: 'c1' }),
          }),
          slots['tree-node-tool']?.({ data: { type: 'code', name: 'C1', key: 'c1' } }),
        ]);
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  codeBlockService.getCodeDsl.mockReturnValue({ c1: { name: 'C1' } });
  codeBlockService.getEditStatus.mockReturnValue(true);
  codeBlockService.getUndeletableList.mockReturnValue([]);
  depService.getTarget.mockReturnValue(null);
  editorService.get.mockImplementation((k: string) => {
    if (k === 'root') return { items: [{ id: 'p1', name: 'page1' }] };
    if (k === 'stage') return { select: vi.fn() };
    return null;
  });
});

describe('CodeBlockList', () => {
  test('渲染 Tree 与节点工具', () => {
    const wrapper = mount(CodeBlockList);
    expect(wrapper.findAll('.edit-icon').length).toBe(2);
  });

  test('编辑按钮 emit edit', async () => {
    const wrapper = mount(CodeBlockList);
    await wrapper.findAll('.edit-icon')[0].trigger('click');
    expect(wrapper.emitted('edit')?.[0]?.[0]).toBe('c1');
  });

  test('删除图标由 Popconfirm 包裹，确认后 emit remove', async () => {
    const wrapper = mount(CodeBlockList);
    const popconfirm = wrapper.findComponent({ name: 'TMagicPopconfirm' });
    expect(popconfirm.exists()).toBe(true);
    expect(popconfirm.props('title')).toBe('确定删除该代码块吗？');
    expect(popconfirm.props('placement')).toBe('right');

    await wrapper.findAll('.edit-icon')[1].trigger('click');
    expect(wrapper.emitted('remove')).toBeFalsy();
    expect(messageBoxConfirm).not.toHaveBeenCalled();

    popconfirm.vm.$emit('confirm');
    expect(wrapper.emitted('remove')?.[0]?.[0]).toBe('c1');
    expect(wrapper.emitted('remove')?.[0]?.[1]).toEqual({ historySource: 'tree' });
  });

  test('点击 Tree 节点选中组件', async () => {
    const stageSelect = vi.fn();
    editorService.get.mockImplementation((k: string) => {
      if (k === 'root') return { items: [{ id: 'p1', name: 'page1' }] };
      if (k === 'stage') return { select: stageSelect };
      return null;
    });
    const wrapper = mount(CodeBlockList);
    await wrapper.find('.click-btn').trigger('click');
    expect(editorService.select).toHaveBeenCalledWith('comp1');
    expect(stageSelect).toHaveBeenCalledWith('comp1');
  });

  test('右键 Tree 节点 emit node-contextmenu', async () => {
    const wrapper = mount(CodeBlockList);
    await wrapper.find('.menu-btn').trigger('click');
    expect(wrapper.emitted('node-contextmenu')).toBeTruthy();
  });

  test('删除按钮: 在不可删除列表 点击时提示错误', async () => {
    codeBlockService.getUndeletableList.mockReturnValue(['c1']);
    const wrapper = mount(CodeBlockList);
    await wrapper.findAll('.edit-icon')[1].trigger('click');
    expect(wrapper.emitted('remove')).toBeFalsy();
    expect(messageError).toHaveBeenCalledWith('代码块不可删除');
  });

  test('Popconfirm 确认时仍校验不可删除列表', () => {
    codeBlockService.getUndeletableList.mockReturnValue(['c1']);
    const wrapper = mount(CodeBlockList);
    wrapper.findComponent({ name: 'TMagicPopconfirm' }).vm.$emit('confirm');
    expect(wrapper.emitted('remove')).toBeFalsy();
    expect(messageError).toHaveBeenCalledWith('代码块不可删除');
  });

  test('删除按钮: 存在绑定关系 提示错误', async () => {
    depService.getTarget.mockReturnValue({
      id: 'c1',
      deps: { n1: { name: 'N1', keys: ['k'], data: { pageId: 'p1' } } },
    } as any);
    const wrapper = mount(CodeBlockList);
    await wrapper.findAll('.edit-icon')[1].trigger('click');
    expect(wrapper.emitted('remove')).toBeFalsy();
    expect(messageError).toHaveBeenCalledWith('代码块存在绑定关系，不可删除');
  });

  test('customError 函数被调用', async () => {
    codeBlockService.getUndeletableList.mockReturnValue(['c1']);
    const customError = vi.fn();
    const wrapper = mount(CodeBlockList, { props: { customError } as any });
    await wrapper.findAll('.edit-icon')[1].trigger('click');
    expect(customError).toHaveBeenCalledWith('c1', 'undeleteable');
  });

  test('customError 在 Popconfirm 确认时被调用', () => {
    codeBlockService.getUndeletableList.mockReturnValue(['c1']);
    const customError = vi.fn();
    const wrapper = mount(CodeBlockList, { props: { customError } as any });
    wrapper.findComponent({ name: 'TMagicPopconfirm' }).vm.$emit('confirm');
    expect(customError).toHaveBeenCalledWith('c1', 'undeleteable');
  });

  test('editable=false 时不显示删除图标和 Popconfirm', () => {
    codeBlockService.getEditStatus.mockReturnValue(false);
    const wrapper = mount(CodeBlockList);
    expect(wrapper.findAll('.edit-icon').length).toBe(1);
    expect(wrapper.findComponent({ name: 'TMagicPopconfirm' }).exists()).toBe(false);
  });
});
