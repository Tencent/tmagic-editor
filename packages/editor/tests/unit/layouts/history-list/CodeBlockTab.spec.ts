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
import type { CodeBlockStepValue, HistoryBucketConfig, StackHistoryGroup } from '@editor/type';

vi.mock('@tmagic/design', () => ({
  TMagicScrollbar: defineComponent({
    name: 'FakeScrollbar',
    props: ['maxHeight'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-scrollbar' }, slots.default?.());
    },
  }),
}));

/** 把以 oldContent/newContent/changeRecords 描述的 fixture 归一成统一 diff 形态的 step。 */
const toDiffStep = (s: any, opType: 'add' | 'remove' | 'update') => ({
  id: s.id,
  opType,
  diff: [
    {
      ...(s.newContent !== null && s.newContent !== undefined ? { newSchema: s.newContent } : {}),
      ...(s.oldContent !== null && s.oldContent !== undefined ? { oldSchema: s.oldContent } : {}),
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
): StackHistoryGroup<CodeBlockStepValue, 'code-block'> => ({
  kind: 'code-block',
  id,
  opType,
  applied,
  steps: steps.map((s, i) => ({ step: toDiffStep(s, opType) as any, index: startIndex + i, applied })),
});

/** 代码块 tab 复用通用 BucketTab，固定注入代码块的 config（title/prefix/describe/isStepDiffable）。 */
const codeBlockConfig: HistoryBucketConfig<any> = {
  title: '代码块',
  prefix: 'cb',
  describeStep: (step: CodeBlockStepValue): string => describeStep(step, (content) => content?.name, '代码块'),
  isStepDiffable: (step: CodeBlockStepValue) => Boolean(step.diff?.[0]?.oldSchema && step.diff?.[0]?.newSchema),
};

const mountCodeBlockTab = (props: { buckets: any[]; expanded: Record<string, boolean> }) =>
  mount(BucketTab, {
    props: {
      config: codeBlockConfig,
      ...props,
    },
  });

describe('CodeBlockTab.vue', () => {
  test('buckets 为空时显示空态', () => {
    const wrapper = mountCodeBlockTab({ buckets: [], expanded: {} });
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
    const wrapper = mountCodeBlockTab({ buckets, expanded: {} });
    expect(wrapper.find('.m-editor-history-list-bucket-title').text()).toContain('代码块');
    expect(wrapper.find('.m-editor-history-list-bucket-title code').text()).toBe('code_1');

    const desc = wrapper.find('.m-editor-history-list-item-desc').text();
    expect(desc).toBe('fn (id: code_1)');
  });

  test('toggle 透传：key 形如 cb-${id}-${idx}', async () => {
    const buckets = [
      {
        id: 'code_1',
        groups: [
          buildGroup('code_1', 'update', [
            {
              id: 'code_1',
              oldContent: { id: 'code_1', name: 'fn' },
              newContent: { id: 'code_1', name: 'fn' },
              changeRecords: [{ propPath: 'a' }],
            },
            {
              id: 'code_1',
              oldContent: { id: 'code_1', name: 'fn' },
              newContent: { id: 'code_1', name: 'fn' },
              changeRecords: [{ propPath: 'b' }],
            },
          ]),
          buildGroup(
            'code_1',
            'update',
            [
              {
                id: 'code_1',
                oldContent: { id: 'code_1', name: 'fn' },
                newContent: { id: 'code_1', name: 'fn' },
                changeRecords: [{ propPath: 'c' }],
              },
              {
                id: 'code_1',
                oldContent: { id: 'code_1', name: 'fn' },
                newContent: { id: 'code_1', name: 'fn' },
                changeRecords: [{ propPath: 'd' }],
              },
            ],
            true,
            2,
          ),
        ],
      },
    ];
    const wrapper = mountCodeBlockTab({ buckets, expanded: {} });
    const heads = wrapper.findAll('.m-editor-history-list-group-head');
    await heads[0].trigger('click');
    expect(wrapper.emitted('toggle')![0]).toEqual(['cb-code_1-0']);
    await heads[1].trigger('click');
    expect(wrapper.emitted('toggle')![1]).toEqual(['cb-code_1-2']);
  });

  test('goto 透传：携带 codeBlock id 与最后一步 index', async () => {
    const buckets = [
      {
        id: 'code_1',
        groups: [
          buildGroup('code_1', 'add', [{ id: 'code_1', oldContent: null, newContent: { id: 'code_1', name: 'fn' } }]),
        ],
      },
    ];
    const wrapper = mountCodeBlockTab({ buckets, expanded: {} });
    await wrapper.find('.m-editor-history-list-item-goto').trigger('click');
    const events = wrapper.emitted('goto');
    expect(events).toBeTruthy();
    expect(events![0]).toEqual(['code_1', 0]);
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
    const wrapper = mountCodeBlockTab({ buckets, expanded: { 'cb-code_1-0': true } });
    const items = wrapper.findAll('.m-editor-history-list-substeps li');
    expect(items).toHaveLength(2);
    // 子步倒序渲染（最新在上）：params 在前，content 在后
    expect(items[0].text()).toContain('fn (id: code_1) · params');
    expect(items[1].text()).toContain('fn (id: code_1) · content');
  });
});
