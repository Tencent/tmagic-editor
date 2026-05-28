/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import PageTab from '@editor/layouts/history-list/PageTab.vue';
import type { PageHistoryGroup } from '@editor/type';

vi.mock('@tmagic/design', () => ({
  TMagicScrollbar: defineComponent({
    name: 'FakeScrollbar',
    props: ['maxHeight'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-scrollbar' }, slots.default?.());
    },
  }),
}));

const buildPageGroup = (
  opType: 'add' | 'remove' | 'update',
  steps: any[],
  applied = true,
  targetName?: string,
  targetId?: string,
): PageHistoryGroup => ({
  kind: 'page',
  pageId: 'p1',
  opType,
  applied,
  targetId,
  targetName,
  steps: steps.map((s, i) => ({ step: s, index: i, applied })),
});

describe('PageTab.vue', () => {
  test('list 为空时显示空态文案', () => {
    const wrapper = mount(PageTab, { props: { list: [], expanded: {} } });
    expect(wrapper.find('.m-editor-history-list-empty').exists()).toBe(true);
    expect(wrapper.find('.m-editor-history-list-empty').text()).toBe('暂无操作记录');
  });

  test('list 非空：每个 group 渲染一行', () => {
    const list = [
      buildPageGroup('add', [{ opType: 'add', nodes: [{ id: 'n1', name: 'A' }] }]),
      buildPageGroup(
        'update',
        [
          {
            opType: 'update',
            updatedItems: [
              {
                newNode: { id: 'btn', name: '按钮' },
                oldNode: { id: 'btn' },
                changeRecords: [{ propPath: 'style.color' }],
              },
            ],
          },
        ],
        true,
        '按钮',
        'btn',
      ),
    ];
    const wrapper = mount(PageTab, { props: { list, expanded: {} } });
    const rows = wrapper.findAll('.m-editor-history-list-group');
    expect(rows).toHaveLength(2);
    // 第一组 add
    expect(rows[0].find('.m-editor-history-list-item-op').text()).toBe('新增');
    expect(rows[0].find('.m-editor-history-list-item-desc').text()).toContain('新增 1 个节点');
    // 第二组 update
    expect(rows[1].find('.m-editor-history-list-item-op').text()).toBe('修改');
    expect(rows[1].find('.m-editor-history-list-item-desc').text()).toBe('修改 按钮 (id: btn) · style.color');
  });

  test('expanded 控制合并组的展开状态（key=pg-${idx}）', async () => {
    const mergedGroup = buildPageGroup(
      'update',
      [
        {
          opType: 'update',
          updatedItems: [
            {
              newNode: { id: 'btn', name: '按钮' },
              oldNode: { id: 'btn' },
              changeRecords: [{ propPath: 'a' }],
            },
          ],
        },
        {
          opType: 'update',
          updatedItems: [
            {
              newNode: { id: 'btn', name: '按钮' },
              oldNode: { id: 'btn' },
              changeRecords: [{ propPath: 'b' }],
            },
          ],
        },
      ],
      true,
      '按钮',
      'btn',
    );

    const wrapper = mount(PageTab, { props: { list: [mergedGroup], expanded: { 'pg-0': true } } });
    expect(wrapper.find('.m-editor-history-list-substeps').exists()).toBe(true);
    expect(wrapper.findAll('.m-editor-history-list-substeps li')).toHaveLength(2);

    await wrapper.setProps({ list: [mergedGroup], expanded: {} });
    expect(wrapper.find('.m-editor-history-list-substeps').exists()).toBe(false);
  });

  test('点击 group 头部触发 toggle 事件，携带 pg-${idx} key', async () => {
    const list = [
      buildPageGroup('add', [{ opType: 'add', nodes: [{ id: 'n1', name: 'A' }] }]),
      buildPageGroup('add', [{ opType: 'add', nodes: [{ id: 'n2', name: 'B' }] }]),
    ];
    const wrapper = mount(PageTab, { props: { list, expanded: {} } });
    const heads = wrapper.findAll('.m-editor-history-list-group-head');
    await heads[1].trigger('click');
    const events = wrapper.emitted('toggle');
    expect(events).toBeTruthy();
    expect(events![0]).toEqual(['pg-1']);
  });

  test('已撤销组（applied=false）附 is-undone 类名', () => {
    const list = [buildPageGroup('add', [{ opType: 'add', nodes: [{ id: 'n1', name: 'A' }] }], false)];
    const wrapper = mount(PageTab, { props: { list, expanded: {} } });
    expect(wrapper.find('.m-editor-history-list-group').classes()).toContain('is-undone');
  });
});
