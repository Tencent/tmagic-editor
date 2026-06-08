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
  startIndex = 0,
): PageHistoryGroup => ({
  kind: 'page',
  pageId: 'p1',
  opType,
  applied,
  targetId,
  targetName,
  steps: steps.map((s, i) => ({ step: s, index: startIndex + i, applied })),
});

describe('PageTab.vue', () => {
  test('list 为空时显示空态文案', () => {
    const wrapper = mount(PageTab, { props: { list: [], expanded: {} } });
    expect(wrapper.find('.m-editor-history-list-empty').exists()).toBe(true);
    expect(wrapper.find('.m-editor-history-list-empty').text()).toBe('暂无操作记录');
  });

  test('list 非空：每个 group 渲染一行', () => {
    const list = [
      buildPageGroup('add', [{ opType: 'add', diff: [{ newSchema: { id: 'n1', name: 'A' } }] }]),
      buildPageGroup(
        'update',
        [
          {
            opType: 'update',
            diff: [
              {
                newSchema: { id: 'btn', name: '按钮' },
                oldSchema: { id: 'btn' },
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

  test('step 含 timestamp 时渲染时间元素', () => {
    const list = [
      buildPageGroup('add', [{ opType: 'add', diff: [{ newSchema: { id: 'n1', name: 'A' } }], timestamp: Date.now() }]),
    ];
    const wrapper = mount(PageTab, { props: { list, expanded: {} } });
    const time = wrapper.find('.m-editor-history-list-item-time');
    expect(time.exists()).toBe(true);
    // 当天记录展示 HH:mm:ss
    expect(time.text()).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  test('step 无 timestamp 时不渲染时间元素', () => {
    const list = [buildPageGroup('add', [{ opType: 'add', diff: [{ newSchema: { id: 'n1', name: 'A' } }] }])];
    const wrapper = mount(PageTab, { props: { list, expanded: {} } });
    expect(wrapper.find('.m-editor-history-list-item-time').exists()).toBe(false);
  });

  test('expanded 控制合并组的展开状态（key=pg-${idx}）', async () => {
    const mergedGroup = buildPageGroup(
      'update',
      [
        {
          opType: 'update',
          diff: [
            {
              newSchema: { id: 'btn', name: '按钮' },
              oldSchema: { id: 'btn' },
              changeRecords: [{ propPath: 'a' }],
            },
          ],
        },
        {
          opType: 'update',
          diff: [
            {
              newSchema: { id: 'btn', name: '按钮' },
              oldSchema: { id: 'btn' },
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

  test('点击合并组头部透传 toggle 事件，携带 pg-${idx} key', async () => {
    const list = [
      // 构造合并组（≥2 步）
      buildPageGroup(
        'update',
        [
          {
            opType: 'update',
            diff: [{ newSchema: { id: 'btn' }, oldSchema: { id: 'btn' }, changeRecords: [{ propPath: 'a' }] }],
          },
          {
            opType: 'update',
            diff: [{ newSchema: { id: 'btn' }, oldSchema: { id: 'btn' }, changeRecords: [{ propPath: 'b' }] }],
          },
        ],
        true,
        '按钮',
        'btn',
      ),
      buildPageGroup(
        'update',
        [
          {
            opType: 'update',
            diff: [{ newSchema: { id: 'btn2' }, oldSchema: { id: 'btn2' }, changeRecords: [{ propPath: 'a' }] }],
          },
          {
            opType: 'update',
            diff: [{ newSchema: { id: 'btn2' }, oldSchema: { id: 'btn2' }, changeRecords: [{ propPath: 'b' }] }],
          },
        ],
        true,
        '按钮2',
        'btn2',
        2,
      ),
    ];
    const wrapper = mount(PageTab, { props: { list, expanded: {} } });
    const heads = wrapper.findAll('.m-editor-history-list-group-head');
    await heads[1].trigger('click');
    const events = wrapper.emitted('toggle');
    expect(events).toBeTruthy();
    expect(events![0]).toEqual(['pg-2']);
    // 合并组头部不应触发 goto
    expect(wrapper.emitted('goto')).toBeFalsy();
  });

  test('点击单步组「回到」按钮透传 goto 事件，携带该 step 的 index', async () => {
    const list = [buildPageGroup('add', [{ opType: 'add', diff: [{ newSchema: { id: 'n1', name: 'A' } }] }])];
    const wrapper = mount(PageTab, { props: { list, expanded: {} } });
    await wrapper.find('.m-editor-history-list-item-goto').trigger('click');
    expect(wrapper.emitted('goto')).toBeTruthy();
    expect(wrapper.emitted('goto')![0]).toEqual([0]);
    expect(wrapper.emitted('toggle')).toBeFalsy();
  });

  test('已撤销组（applied=false）附 is-undone 类名', () => {
    const list = [buildPageGroup('add', [{ opType: 'add', diff: [{ newSchema: { id: 'n1', name: 'A' } }] }], false)];
    const wrapper = mount(PageTab, { props: { list, expanded: {} } });
    expect(wrapper.find('.m-editor-history-list-group').classes()).toContain('is-undone');
  });

  test('list 非空时在底部追加「初始状态」项；list 为空时不渲染', () => {
    // 空 list：走空态分支，不应有初始项
    const empty = mount(PageTab, { props: { list: [], expanded: {} } });
    expect(empty.find('.m-editor-history-list-initial').exists()).toBe(false);

    // 非空 list：底部应有一条初始项
    const list = [buildPageGroup('add', [{ opType: 'add', diff: [{ newSchema: { id: 'n1', name: 'A' } }] }])];
    const wrapper = mount(PageTab, { props: { list, expanded: {} } });
    expect(wrapper.find('.m-editor-history-list-initial').exists()).toBe(true);
  });

  test('全部 group 都未 applied 时初始项标记为当前', () => {
    const list = [buildPageGroup('add', [{ opType: 'add', diff: [{ newSchema: { id: 'n1', name: 'A' } }] }], false)];
    const wrapper = mount(PageTab, { props: { list, expanded: {} } });
    const initial = wrapper.find('.m-editor-history-list-initial');
    expect(initial.classes()).toContain('is-current');
  });

  test('存在已 applied 的 group 时初始项不为当前', () => {
    const list = [
      buildPageGroup('add', [{ opType: 'add', diff: [{ newSchema: { id: 'n1', name: 'A' } }] }], true),
      buildPageGroup('add', [{ opType: 'add', diff: [{ newSchema: { id: 'n2', name: 'B' } }] }], false),
    ];
    const wrapper = mount(PageTab, { props: { list, expanded: {} } });
    const initial = wrapper.find('.m-editor-history-list-initial');
    expect(initial.classes()).not.toContain('is-current');
  });

  test('点击非当前初始项的「回到」按钮透传 goto-initial 事件', async () => {
    const list = [buildPageGroup('add', [{ opType: 'add', diff: [{ newSchema: { id: 'n1', name: 'A' } }] }], true)];
    const wrapper = mount(PageTab, { props: { list, expanded: {} } });
    await wrapper.find('.m-editor-history-list-initial .m-editor-history-list-item-goto').trigger('click');
    expect(wrapper.emitted('goto-initial')).toBeTruthy();
    expect(wrapper.emitted('goto-initial')).toHaveLength(1);
  });
});
