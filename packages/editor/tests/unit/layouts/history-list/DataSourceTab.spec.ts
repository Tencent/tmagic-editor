/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import BucketTab from '@editor/layouts/history-list/BucketTab.vue';
import { describeStep } from '@editor/layouts/history-list/composables';
import type { DataSourceStepValue, HistoryBucketConfig, StackHistoryGroup } from '@editor/type';

vi.mock('@tmagic/design', () => ({
  TMagicScrollbar: defineComponent({
    name: 'FakeScrollbar',
    props: ['maxHeight'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-scrollbar' }, slots.default?.());
    },
  }),
}));

/** 把以 oldSchema/newSchema/changeRecords 描述的 fixture 归一成统一 diff 形态的 step。 */
const toDiffStep = (s: any, opType: 'add' | 'remove' | 'update') => ({
  id: s.id,
  opType,
  diff: [
    {
      ...(s.newSchema !== null && s.newSchema !== undefined ? { newSchema: s.newSchema } : {}),
      ...(s.oldSchema !== null && s.oldSchema !== undefined ? { oldSchema: s.oldSchema } : {}),
      ...(s.changeRecords ? { changeRecords: s.changeRecords } : {}),
    },
  ],
});

const buildGroup = (
  id: string,
  opType: 'add' | 'remove' | 'update',
  steps: any[],
  applied = true,
  startIndex = 0,
): StackHistoryGroup<DataSourceStepValue, 'data-source'> => ({
  kind: 'data-source',
  id,
  opType,
  applied,
  steps: steps.map((s, i) => ({ step: toDiffStep(s, opType) as any, index: startIndex + i, applied })),
});

/** 数据源 tab 复用通用 BucketTab，固定注入数据源的 config（title/prefix/describe/isStepDiffable）。 */
const dataSourceConfig: HistoryBucketConfig<any> = {
  title: '数据源',
  prefix: 'ds',
  describeStep: (step: DataSourceStepValue): string => describeStep(step, (schema) => schema?.title, '数据源'),
  isStepDiffable: (step: DataSourceStepValue) => Boolean(step.diff?.[0]?.oldSchema && step.diff?.[0]?.newSchema),
};

const mountDataSourceTab = (props: { buckets: any[]; expanded: Record<string, boolean> }) =>
  mount(BucketTab, {
    props: {
      config: dataSourceConfig,
      ...props,
    },
  });

describe('DataSourceTab.vue', () => {
  test('buckets 为空时显示空态', () => {
    const wrapper = mountDataSourceTab({ buckets: [], expanded: {} });
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
    const wrapper = mountDataSourceTab({ buckets, expanded: {} });
    const titles = wrapper.findAll('.m-editor-history-list-bucket-title');
    expect(titles).toHaveLength(2);
    expect(titles[0].text()).toContain('数据源');
    expect(titles[0].find('code').text()).toBe('ds_1');
    expect(titles[1].find('code').text()).toBe('ds_2');

    const rows = wrapper.findAll('.m-editor-history-list-group');
    expect(rows).toHaveLength(2);
    expect(rows[0].find('.m-editor-history-list-item-op').text()).toBe('新增');
    expect(rows[0].find('.m-editor-history-list-item-desc').text()).toBe('A (id: ds_1)');
    expect(rows[1].find('.m-editor-history-list-item-op').text()).toBe('删除');
    expect(rows[1].find('.m-editor-history-list-item-desc').text()).toBe('B (id: ds_2)');
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
          buildGroup(
            'ds_1',
            'update',
            [
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
            ],
            true,
            2,
          ),
        ],
      },
    ];
    const wrapper = mountDataSourceTab({ buckets, expanded: {} });
    const heads = wrapper.findAll('.m-editor-history-list-group-head');
    await heads[1].trigger('click');
    expect(wrapper.emitted('toggle')![0]).toEqual(['ds-ds_1-2']);
  });

  test('goto 透传：携带 dataSource id 与最后一步 index', async () => {
    const buckets = [
      {
        id: 'ds_1',
        groups: [buildGroup('ds_1', 'add', [{ id: 'ds_1', oldSchema: null, newSchema: { id: 'ds_1', title: 'A' } }])],
      },
    ];
    const wrapper = mountDataSourceTab({ buckets, expanded: {} });
    await wrapper.find('.m-editor-history-list-item-goto').trigger('click');
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
    const wrapper = mountDataSourceTab({ buckets, expanded: { 'ds-ds_1-0': true } });
    expect(wrapper.findAll('.m-editor-history-list-substeps li')).toHaveLength(2);
  });
});
