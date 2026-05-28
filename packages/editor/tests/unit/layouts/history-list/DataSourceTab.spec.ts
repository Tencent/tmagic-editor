/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import DataSourceTab from '@editor/layouts/history-list/DataSourceTab.vue';
import type { DataSourceHistoryGroup } from '@editor/type';

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
): DataSourceHistoryGroup => ({
  kind: 'data-source',
  id,
  opType,
  applied,
  steps: steps.map((s, i) => ({ step: s, index: i, applied })),
});

describe('DataSourceTab.vue', () => {
  test('buckets 为空时显示空态', () => {
    const wrapper = mount(DataSourceTab, { props: { buckets: [], expanded: {} } });
    expect(wrapper.find('.m-editor-history-list-empty').exists()).toBe(true);
  });

  test('每个 bucket 渲染一组（标题为「数据源」+ id）', () => {
    const buckets = [
      {
        id: 'ds_1',
        groups: [buildGroup('ds_1', 'add', [{ id: 'ds_1', oldSchema: null, newSchema: { id: 'ds_1', title: 'A' } }])],
      },
      {
        id: 'ds_2',
        groups: [
          buildGroup('ds_2', 'remove', [{ id: 'ds_2', oldSchema: { id: 'ds_2', title: 'B' }, newSchema: null }]),
        ],
      },
    ];
    const wrapper = mount(DataSourceTab, { props: { buckets, expanded: {} } });
    const titles = wrapper.findAll('.m-editor-history-list-bucket-title');
    expect(titles).toHaveLength(2);
    expect(titles[0].text()).toContain('数据源');
    expect(titles[0].find('code').text()).toBe('ds_1');
    expect(titles[1].find('code').text()).toBe('ds_2');

    const rows = wrapper.findAll('.m-editor-history-list-group');
    expect(rows).toHaveLength(2);
    expect(rows[0].find('.m-editor-history-list-item-op').text()).toBe('新增');
    expect(rows[0].find('.m-editor-history-list-item-desc').text()).toBe('创建 A (id: ds_1)');
    expect(rows[1].find('.m-editor-history-list-item-op').text()).toBe('删除');
    expect(rows[1].find('.m-editor-history-list-item-desc').text()).toBe('删除 B (id: ds_2)');
  });

  test('toggle 透传：key 形如 ds-${id}-${idx}', async () => {
    const buckets = [
      {
        id: 'ds_1',
        groups: [
          buildGroup('ds_1', 'update', [
            {
              id: 'ds_1',
              oldSchema: { id: 'ds_1', title: 'A' },
              newSchema: { id: 'ds_1', title: 'A' },
              changeRecords: [{ propPath: 'a' }],
            },
            {
              id: 'ds_1',
              oldSchema: { id: 'ds_1', title: 'A' },
              newSchema: { id: 'ds_1', title: 'A' },
              changeRecords: [{ propPath: 'b' }],
            },
          ]),
          buildGroup('ds_1', 'update', [
            {
              id: 'ds_1',
              oldSchema: { id: 'ds_1', title: 'A' },
              newSchema: { id: 'ds_1', title: 'A2' },
              changeRecords: [{ propPath: 'c' }],
            },
            {
              id: 'ds_1',
              oldSchema: { id: 'ds_1', title: 'A2' },
              newSchema: { id: 'ds_1', title: 'A3' },
              changeRecords: [{ propPath: 'd' }],
            },
          ]),
        ],
      },
    ];
    const wrapper = mount(DataSourceTab, { props: { buckets, expanded: {} } });
    const heads = wrapper.findAll('.m-editor-history-list-group-head');
    await heads[1].trigger('click');
    expect(wrapper.emitted('toggle')![0]).toEqual(['ds-ds_1-1']);
  });

  test('goto 透传：携带 dataSource id 与最后一步 index', async () => {
    const buckets = [
      {
        id: 'ds_1',
        groups: [buildGroup('ds_1', 'add', [{ id: 'ds_1', oldSchema: null, newSchema: { id: 'ds_1', title: 'A' } }])],
      },
    ];
    const wrapper = mount(DataSourceTab, { props: { buckets, expanded: {} } });
    await wrapper.find('.m-editor-history-list-group-head').trigger('click');
    const events = wrapper.emitted('goto');
    expect(events).toBeTruthy();
    expect(events![0]).toEqual(['ds_1', 0]);
  });

  test('expanded 中对应 key 打开时展示子步', () => {
    const buckets = [
      {
        id: 'ds_1',
        groups: [
          buildGroup('ds_1', 'update', [
            {
              id: 'ds_1',
              oldSchema: { id: 'ds_1', title: 'A' },
              newSchema: { id: 'ds_1', title: 'A' },
              changeRecords: [{ propPath: 'a' }],
            },
            {
              id: 'ds_1',
              oldSchema: { id: 'ds_1', title: 'A' },
              newSchema: { id: 'ds_1', title: 'A' },
              changeRecords: [{ propPath: 'b' }],
            },
          ]),
        ],
      },
    ];
    const wrapper = mount(DataSourceTab, {
      props: { buckets, expanded: { 'ds-ds_1-0': true } },
    });
    expect(wrapper.findAll('.m-editor-history-list-substeps li')).toHaveLength(2);
  });
});
