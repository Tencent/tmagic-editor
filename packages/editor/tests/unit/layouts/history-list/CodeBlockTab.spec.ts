/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import CodeBlockTab from '@editor/layouts/history-list/CodeBlockTab.vue';
import type { CodeBlockHistoryGroup } from '@editor/type';

vi.mock('@tmagic/design', () => ({
  TMagicScrollbar: defineComponent({
    name: 'FakeScrollbar',
    props: ['maxHeight'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-scrollbar' }, slots.default?.());
    },
  }),
}));

const buildGroup = (
  id: string,
  opType: 'add' | 'remove' | 'update',
  steps: any[],
  applied = true,
): CodeBlockHistoryGroup => ({
  kind: 'code-block',
  id,
  opType,
  applied,
  steps: steps.map((s, i) => ({ step: s, index: i, applied })),
});

describe('CodeBlockTab.vue', () => {
  test('buckets 为空时显示空态', () => {
    const wrapper = mount(CodeBlockTab, { props: { buckets: [], expanded: {} } });
    expect(wrapper.find('.m-editor-history-list-empty').exists()).toBe(true);
  });

  test('每个 bucket 渲染一组（标题为「代码块」+ id）', () => {
    const buckets = [
      {
        id: 'code_1',
        groups: [
          buildGroup('code_1', 'add', [{ id: 'code_1', oldContent: null, newContent: { id: 'code_1', name: 'fn' } }]),
        ],
      },
    ];
    const wrapper = mount(CodeBlockTab, { props: { buckets, expanded: {} } });
    expect(wrapper.find('.m-editor-history-list-bucket-title').text()).toContain('代码块');
    expect(wrapper.find('.m-editor-history-list-bucket-title code').text()).toBe('code_1');

    const desc = wrapper.find('.m-editor-history-list-item-desc').text();
    expect(desc).toBe('创建 fn (id: code_1)');
  });

  test('toggle 透传：key 形如 cb-${id}-${idx}', async () => {
    const buckets = [
      {
        id: 'code_1',
        groups: [
          buildGroup('code_1', 'add', [{ id: 'code_1', oldContent: null, newContent: { id: 'code_1', name: 'fn' } }]),
          buildGroup('code_1', 'remove', [
            { id: 'code_1', oldContent: { id: 'code_1', name: 'fn' }, newContent: null },
          ]),
        ],
      },
    ];
    const wrapper = mount(CodeBlockTab, { props: { buckets, expanded: {} } });
    const heads = wrapper.findAll('.m-editor-history-list-group-head');
    await heads[0].trigger('click');
    expect(wrapper.emitted('toggle')![0]).toEqual(['cb-code_1-0']);
    await heads[1].trigger('click');
    expect(wrapper.emitted('toggle')![1]).toEqual(['cb-code_1-1']);
  });

  test('合并组在 expanded 时展开子步', () => {
    const buckets = [
      {
        id: 'code_1',
        groups: [
          buildGroup('code_1', 'update', [
            {
              id: 'code_1',
              oldContent: { id: 'code_1', name: 'fn' },
              newContent: { id: 'code_1', name: 'fn' },
              changeRecords: [{ propPath: 'content' }],
            },
            {
              id: 'code_1',
              oldContent: { id: 'code_1', name: 'fn' },
              newContent: { id: 'code_1', name: 'fn' },
              changeRecords: [{ propPath: 'params' }],
            },
          ]),
        ],
      },
    ];
    const wrapper = mount(CodeBlockTab, {
      props: { buckets, expanded: { 'cb-code_1-0': true } },
    });
    const items = wrapper.findAll('.m-editor-history-list-substeps li');
    expect(items).toHaveLength(2);
    expect(items[0].text()).toContain('修改 fn (id: code_1) · content');
    expect(items[1].text()).toContain('修改 fn (id: code_1) · params');
  });
});
