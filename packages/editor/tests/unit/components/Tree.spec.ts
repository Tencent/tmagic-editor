/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { mount } from '@vue/test-utils';

import Tree from '@editor/components/Tree.vue';
import TreeNode from '@editor/components/TreeNode.vue';

const buildStatusMap = (overrides: Record<string, any> = {}) => {
  const map = new Map<string | number, any>();
  Object.entries(overrides).forEach(([k, v]) => {
    map.set(k, { selected: false, expand: false, visible: true, draggable: true, ...v });
  });
  return map;
};

describe('Tree.vue', () => {
  test('data 为空时渲染 emptyText', () => {
    const wrapper = mount(Tree as any, {
      props: {
        data: [],
        nodeStatusMap: new Map(),
        emptyText: '什么都没有',
      },
    });
    expect(wrapper.find('.m-editor-tree-empty').text()).toBe('什么都没有');
  });

  test('data 非空时渲染 TreeNode', () => {
    const wrapper = mount(Tree as any, {
      props: {
        data: [
          { id: '1', name: 'A' },
          { id: '2', name: 'B' },
        ],
        nodeStatusMap: buildStatusMap({ '1': {}, '2': {} }),
      },
    });
    expect(wrapper.findAllComponents(TreeNode).length).toBeGreaterThanOrEqual(2);
  });

  test('dragover 事件向上抛 node-dragover', async () => {
    const wrapper = mount(Tree as any, {
      props: {
        data: [{ id: '1', name: 'A' }],
        nodeStatusMap: buildStatusMap({ '1': {} }),
      },
    });
    await wrapper.find('.m-editor-tree').trigger('dragover');
    expect(wrapper.emitted('node-dragover')).toBeTruthy();
  });
});

describe('TreeNode.vue', () => {
  test('节点不可见时不会渲染', () => {
    const wrapper = mount(TreeNode as any, {
      props: {
        data: { id: '1', name: 'A' },
        nodeStatusMap: buildStatusMap({ '1': { visible: false } }),
      },
    });
    const root = wrapper.find('.m-editor-tree-node');
    expect(root.attributes('style')).toContain('display: none');
  });

  test('节点可见时渲染节点内容', () => {
    const wrapper = mount(TreeNode as any, {
      props: {
        data: { id: '1', name: 'A' },
        nodeStatusMap: buildStatusMap({ '1': { visible: true } }),
      },
    });
    expect(wrapper.text()).toContain('A');
    expect(wrapper.text()).toContain('1');
  });

  test('点击展开图标会切换展开状态', async () => {
    const status = buildStatusMap({ '1': { visible: true, expand: false } });
    const wrapper = mount(TreeNode as any, {
      props: {
        data: { id: '1', name: 'A', items: [{ id: '2', name: 'B' }] },
        nodeStatusMap: status,
      },
    });
    await wrapper.find('.expand-icon').trigger('click');
    expect(status.get('1').expand).toBe(true);
  });

  test('展开后渲染子节点', () => {
    const wrapper = mount(TreeNode as any, {
      props: {
        data: { id: '1', name: 'A', items: [{ id: '2', name: 'B' }] },
        nodeStatusMap: buildStatusMap({
          '1': { visible: true, expand: true },
          '2': { visible: true },
        }),
      },
    });
    expect(wrapper.findAllComponents(TreeNode).length).toBeGreaterThanOrEqual(1);
  });

  test('内容点击触发 node-click（通过 treeEmit）', async () => {
    const calls: string[] = [];
    const wrapper = mount(TreeNode as any, {
      props: {
        data: { id: '1', name: 'A' },
        nodeStatusMap: buildStatusMap({ '1': { visible: true } }),
      },
      global: {
        provide: {
          treeEmit: (name: string) => {
            calls.push(name);
          },
        },
      },
    });
    await wrapper.find('.tree-node-content').trigger('click');
    await wrapper.find('.tree-node-content').trigger('dblclick');
    await wrapper.find('.tree-node').trigger('contextmenu');
    await wrapper.find('.tree-node').trigger('mouseenter');
    await wrapper.find('.m-editor-tree-node').trigger('dragstart');
    await wrapper.find('.m-editor-tree-node').trigger('dragleave');
    await wrapper.find('.m-editor-tree-node').trigger('dragend');
    expect(calls).toEqual(
      expect.arrayContaining([
        'node-click',
        'node-dblclick',
        'node-contextmenu',
        'node-mouseenter',
        'node-dragstart',
        'node-dragleave',
        'node-dragend',
      ]),
    );
  });
});
