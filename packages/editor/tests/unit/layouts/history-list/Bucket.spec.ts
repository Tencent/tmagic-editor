/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { mount } from '@vue/test-utils';

import Bucket from '@editor/layouts/history-list/Bucket.vue';
import type { HistoryBucketConfig } from '@editor/layouts/history-list/composables';

const buildGroup = (opType: 'add' | 'remove' | 'update', stepCount: number, applied = true): any => ({
  applied,
  opType,
  steps: Array.from({ length: stepCount }, (_, i) => ({
    index: i,
    applied,
    step: { mark: `s-${i}` },
  })),
});

/** 把 title/prefix/describe* 收敛成单一 config，贴近真实调用方式。 */
const buildConfig = (overrides: Partial<HistoryBucketConfig<any>> = {}): HistoryBucketConfig<any> => ({
  title: '数据源',
  prefix: 'ds',
  describeGroup: () => 'desc',
  describeStep: () => 'sub-desc',
  ...overrides,
});

describe('Bucket.vue', () => {
  test('渲染 bucket 头部信息与组数', () => {
    const wrapper = mount(Bucket, {
      props: {
        config: buildConfig(),
        bucketId: 'ds_1',
        groups: [buildGroup('update', 1), buildGroup('add', 1)],
        expanded: {},
      },
    });
    const head = wrapper.find('.m-editor-history-list-bucket-title');
    expect(head.text()).toContain('数据源');
    expect(head.find('code').text()).toBe('ds_1');
    expect(head.find('.m-editor-history-list-bucket-count').text()).toBe('2 组');
  });

  test('为每个 group 渲染一个 GroupRow 并通过描述生成器生成文案', () => {
    const groups = [buildGroup('update', 2), buildGroup('remove', 1)];
    const describeGroup = (g: any) => `group-${g.opType}-${g.steps.length}`;
    const describeStep = (s: any) => `step-${s.mark}`;

    const wrapper = mount(Bucket, {
      props: {
        config: buildConfig({ title: '代码块', prefix: 'cb', describeGroup, describeStep }),
        bucketId: 'code_1',
        groups,
        expanded: { 'cb-code_1-0': true },
      },
    });
    const rows = wrapper.findAll('.m-editor-history-list-group');
    expect(rows).toHaveLength(2);
    // 第一组（merged，2 步）的 desc 来自 describeGroup
    expect(rows[0].find('.m-editor-history-list-item-desc').text()).toBe('group-update-2');
    expect(rows[0].find('.m-editor-history-list-item-merge').exists()).toBe(true);
    // 第一组展开后渲染的子步描述来自 describeStep
    const subItems = rows[0].findAll('.m-editor-history-list-substeps li');
    expect(subItems).toHaveLength(2);
    // 子步倒序渲染（最新在上）：s-1 在前，s-0 在后
    expect(subItems[0].text()).toContain('step-s-1');
    expect(subItems[1].text()).toContain('step-s-0');

    // 第二组只有 1 步：未合并
    expect(rows[1].find('.m-editor-history-list-item-merge').exists()).toBe(false);
    expect(rows[1].find('.m-editor-history-list-item-desc').text()).toBe('group-remove-1');
  });

  test('合并组头部点击 → toggle 事件被透传到 Bucket', async () => {
    const wrapper = mount(Bucket, {
      props: {
        config: buildConfig({ title: '代码块', prefix: 'cb', describeGroup: () => 'g', describeStep: () => 's' }),
        bucketId: 'code_1',
        groups: [buildGroup('update', 2)],
        expanded: {},
      },
    });
    await wrapper.find('.m-editor-history-list-group-head').trigger('click');
    const events = wrapper.emitted('toggle');
    expect(events).toBeTruthy();
    expect(events![0]).toEqual(['cb-code_1-0']);
    // 合并组头部不应触发 goto
    expect(wrapper.emitted('goto')).toBeFalsy();
  });

  test('单步组「回到」按钮点击 → goto 事件被透传到 Bucket，并附带 bucketId', async () => {
    const wrapper = mount(Bucket, {
      props: {
        config: buildConfig({ title: '代码块', prefix: 'cb', describeGroup: () => 'g', describeStep: () => 's' }),
        bucketId: 'code_1',
        groups: [buildGroup('update', 1)],
        expanded: {},
      },
    });
    await wrapper.find('.m-editor-history-list-item-goto').trigger('click');
    const events = wrapper.emitted('goto');
    expect(events).toBeTruthy();
    expect(events![0]).toEqual(['code_1', 0]);
  });

  test('合并组展开后点击子步「回到」按钮 → goto 透传，附带子步 index', async () => {
    const wrapper = mount(Bucket, {
      props: {
        config: buildConfig({ title: '代码块', prefix: 'cb', describeGroup: () => 'g', describeStep: () => 's' }),
        bucketId: 'code_1',
        groups: [buildGroup('update', 2)],
        expanded: { 'cb-code_1-0': true },
      },
    });
    const subItems = wrapper.findAll('.m-editor-history-list-substeps li');
    expect(subItems).toHaveLength(2);
    // 子步倒序渲染：subItems[0] 对应 index=1
    await subItems[0].find('.m-editor-history-list-item-goto').trigger('click');
    const events = wrapper.emitted('goto');
    expect(events).toBeTruthy();
    expect(events![0]).toEqual(['code_1', 1]);
  });

  test('groupKey 命名空间使用 prefix + bucketId + 索引', () => {
    const wrapper = mount(Bucket, {
      props: {
        config: buildConfig({ describeGroup: () => 'g', describeStep: () => 's' }),
        bucketId: 42,
        groups: [buildGroup('update', 2), buildGroup('add', 1)],
        // 给第二组打开展开状态
        expanded: { 'ds-42-1': true },
      },
    });
    // 第二组只有 1 步，不应渲染 substeps（即使 expanded 为 true）
    const rows = wrapper.findAll('.m-editor-history-list-group');
    expect(rows[1].find('.m-editor-history-list-substeps').exists()).toBe(false);
    // 第一组未展开，也不应有 substeps
    expect(rows[0].find('.m-editor-history-list-substeps').exists()).toBe(false);
  });

  test('groups 非空时底部追加初始项；点击透传 goto-initial 携带 bucketId', async () => {
    const wrapper = mount(Bucket, {
      props: {
        config: buildConfig({ describeGroup: () => 'g', describeStep: () => 's' }),
        bucketId: 'ds_1',
        groups: [buildGroup('add', 1)],
        expanded: {},
      },
    });
    const initial = wrapper.find('.m-editor-history-list-initial');
    expect(initial.exists()).toBe(true);
    // 已有 applied 组，初始项不应为当前
    expect(initial.classes()).not.toContain('is-current');

    await initial.find('.m-editor-history-list-item-goto').trigger('click');
    const events = wrapper.emitted('goto-initial');
    expect(events).toBeTruthy();
    expect(events![0]).toEqual(['ds_1']);
  });

  test('该 bucket 全部组都已撤销时初始项标记为当前', () => {
    const wrapper = mount(Bucket, {
      props: {
        config: buildConfig({ title: '代码块', prefix: 'cb', describeGroup: () => 'g', describeStep: () => 's' }),
        bucketId: 'cb_1',
        groups: [buildGroup('add', 1, false), buildGroup('update', 2, false)],
        expanded: {},
      },
    });
    expect(wrapper.find('.m-editor-history-list-initial').classes()).toContain('is-current');
  });
});
