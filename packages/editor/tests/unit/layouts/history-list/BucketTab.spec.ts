/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { mount } from '@vue/test-utils';

import BucketTab from '@editor/layouts/history-list/BucketTab.vue';
import type { HistoryBucketConfig } from '@editor/type';

const buildConfig = (): HistoryBucketConfig<any> => ({
  title: '数据源',
  prefix: 'ds',
  describeGroup: () => 'desc',
  describeStep: () => 'sub-desc',
});

const buildGroup = (): any => ({
  applied: true,
  opType: 'update' as const,
  steps: [{ index: 0, applied: true, step: { mark: 's-0' } }],
});

describe('BucketTab.vue', () => {
  test('buckets 为空时显示空态', () => {
    const wrapper = mount(BucketTab, {
      props: {
        config: buildConfig(),
        buckets: [],
        expanded: {},
      },
    });
    expect(wrapper.find('.m-editor-history-list-empty').text()).toBe('暂无操作记录');
  });

  test('buckets 非空时渲染 toolbar 与 Bucket 列表', () => {
    const wrapper = mount(BucketTab, {
      props: {
        config: buildConfig(),
        buckets: [{ id: 'ds_1', groups: [buildGroup()] }],
        expanded: {},
      },
    });
    expect(wrapper.find('.m-editor-history-list-toolbar').exists()).toBe(true);
    expect(wrapper.find('.m-editor-history-list-bucket-title').exists()).toBe(true);
  });

  test('点击清空按钮触发 clear 事件', async () => {
    const wrapper = mount(BucketTab, {
      props: {
        config: buildConfig(),
        buckets: [{ id: 'ds_1', groups: [buildGroup()] }],
        expanded: {},
      },
    });
    await wrapper.find('.m-editor-history-list-clear').trigger('click');
    expect(wrapper.emitted('clear')).toBeTruthy();
  });

  test('config.showClear 为 false 时不渲染清空按钮', () => {
    const wrapper = mount(BucketTab, {
      props: {
        config: { ...buildConfig(), showClear: false },
        buckets: [{ id: 'ds_1', groups: [buildGroup()] }],
        expanded: {},
      },
    });
    expect(wrapper.find('.m-editor-history-list-toolbar').exists()).toBe(false);
    expect(wrapper.find('.m-editor-history-list-clear').exists()).toBe(false);
  });

  test('透传 Bucket 子组件事件', async () => {
    const wrapper = mount(BucketTab, {
      props: {
        config: buildConfig(),
        buckets: [{ id: 'ds_1', groups: [buildGroup()] }],
        expanded: {},
      },
    });
    await wrapper.find('.m-editor-history-list-item-goto').trigger('click');
    expect(wrapper.emitted('goto')?.[0]).toEqual(['ds_1', 0]);
  });
});
