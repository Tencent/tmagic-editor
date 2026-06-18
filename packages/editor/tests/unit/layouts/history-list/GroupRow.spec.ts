/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { mount } from '@vue/test-utils';

import type { HistoryRowGroup, HistoryRowStep } from '@editor/layouts/history-list/composables';
import GroupRow from '@editor/layouts/history-list/GroupRow.vue';

/** 构造 GroupRow 的视图模型（merged / stepCount 由 subSteps 长度派生）。 */
const makeGroup = (overrides: Partial<HistoryRowGroup> = {}): HistoryRowGroup => ({
  key: 'pg-0',
  applied: true,
  isCurrent: false,
  opType: 'update',
  desc: '修改 按钮',
  subSteps: [],
  ...overrides,
});

/** 构造单个子步，缺省值贴近真实派生结果。 */
const makeStep = (overrides: Partial<HistoryRowStep> & Pick<HistoryRowStep, 'index'>): HistoryRowStep => ({
  applied: true,
  isCurrent: false,
  desc: '',
  ...overrides,
});

describe('GroupRow.vue', () => {
  test('渲染描述与操作类型徽标（update→修改）', () => {
    const wrapper = mount(GroupRow, { props: { group: makeGroup(), expanded: false } });
    expect(wrapper.find('.m-editor-history-list-item-desc').text()).toBe('修改 按钮');
    const op = wrapper.find('.m-editor-history-list-item-op');
    expect(op.text()).toBe('修改');
    expect(op.classes()).toContain('op-update');
  });

  test('add / remove 操作徽标使用对应类名与文案', () => {
    const w1 = mount(GroupRow, { props: { group: makeGroup({ opType: 'add' }), expanded: false } });
    expect(w1.find('.m-editor-history-list-item-op').text()).toBe('新增');
    expect(w1.find('.m-editor-history-list-item-op').classes()).toContain('op-add');

    const w2 = mount(GroupRow, { props: { group: makeGroup({ opType: 'remove' }), expanded: false } });
    expect(w2.find('.m-editor-history-list-item-op').text()).toBe('删除');
    expect(w2.find('.m-editor-history-list-item-op').classes()).toContain('op-remove');
  });

  test('applied=false 时附加 is-undone 类名', () => {
    const wrapper = mount(GroupRow, { props: { group: makeGroup({ applied: false }), expanded: false } });
    expect(wrapper.find('.m-editor-history-list-group').classes()).toContain('is-undone');
  });

  test('merged（子步数>1）时显示「合并 N 步」并附 is-merged 类名', () => {
    const wrapper = mount(GroupRow, {
      props: {
        group: makeGroup({
          subSteps: [makeStep({ index: 0 }), makeStep({ index: 1 }), makeStep({ index: 2 })],
        }),
        expanded: false,
      },
    });
    expect(wrapper.find('.m-editor-history-list-group').classes()).toContain('is-merged');
    expect(wrapper.find('.m-editor-history-list-item-merge').text()).toBe('合并 3 步');
  });

  test('未合并时不渲染合并标记', () => {
    const wrapper = mount(GroupRow, { props: { group: makeGroup(), expanded: false } });
    expect(wrapper.find('.m-editor-history-list-item-merge').exists()).toBe(false);
  });

  test('传入 time 时头部渲染时间，title 取 timeTitle', () => {
    const wrapper = mount(GroupRow, {
      props: { group: makeGroup({ time: '12:00:00', timeTitle: '2026-06-03 12:00:00' }), expanded: false },
    });
    const time = wrapper.find('.m-editor-history-list-item-time');
    expect(time.exists()).toBe(true);
    expect(time.text()).toBe('12:00:00');
    expect(time.attributes('title')).toBe('2026-06-03 12:00:00');
  });

  test('未传 time 时头部不渲染时间元素', () => {
    const wrapper = mount(GroupRow, { props: { group: makeGroup(), expanded: false } });
    expect(wrapper.find('.m-editor-history-list-item-time').exists()).toBe(false);
  });

  test('timeTitle 缺省时 title 回退为 time 本身', () => {
    const wrapper = mount(GroupRow, { props: { group: makeGroup({ time: '08:30:00' }), expanded: false } });
    expect(wrapper.find('.m-editor-history-list-item-time').attributes('title')).toBe('08:30:00');
  });

  test('展开的子步各自渲染自己的时间', () => {
    const wrapper = mount(GroupRow, {
      props: {
        group: makeGroup({
          subSteps: [
            makeStep({ index: 0, desc: '修改 颜色', time: '10:00:00', timeTitle: '2026-06-03 10:00:00' }),
            makeStep({ index: 1, desc: '修改 字号', time: '10:01:00', timeTitle: '2026-06-03 10:01:00' }),
          ],
        }),
        expanded: true,
      },
    });
    const items = wrapper.findAll('.m-editor-history-list-substeps li');
    // 子步倒序渲染：index=1 在前
    expect(items[0].find('.m-editor-history-list-item-time').text()).toBe('10:01:00');
    expect(items[1].find('.m-editor-history-list-item-time').text()).toBe('10:00:00');
  });

  test('merged 且 expanded=true 时渲染子步列表', () => {
    const wrapper = mount(GroupRow, {
      props: {
        group: makeGroup({
          subSteps: [
            makeStep({ index: 0, applied: true, desc: '修改 颜色' }),
            makeStep({ index: 1, applied: false, desc: '修改 字号' }),
          ],
        }),
        expanded: true,
      },
    });
    const items = wrapper.findAll('.m-editor-history-list-substeps li');
    expect(items).toHaveLength(2);
    // 子步倒序渲染（最新在上）：index=1 在前，index=0 在后
    expect(items[0].text()).toContain('#2');
    expect(items[0].text()).toContain('修改 字号');
    // 最新（index=1）子步未应用
    expect(items[0].classes()).toContain('is-undone');
    expect(items[1].text()).toContain('#1');
    expect(items[1].text()).toContain('修改 颜色');
  });

  test('merged 但 expanded=false 时不渲染子步列表', () => {
    const wrapper = mount(GroupRow, {
      props: {
        group: makeGroup({ subSteps: [makeStep({ index: 0, desc: 'x' }), makeStep({ index: 1, desc: 'y' })] }),
        expanded: false,
      },
    });
    expect(wrapper.find('.m-editor-history-list-substeps').exists()).toBe(false);
  });

  test('点击合并组头部触发 toggle 事件并携带 group.key', async () => {
    const wrapper = mount(GroupRow, {
      props: {
        group: makeGroup({ subSteps: [makeStep({ index: 0 }), makeStep({ index: 1 })] }),
        expanded: false,
      },
    });
    await wrapper.find('.m-editor-history-list-group-head').trigger('click');
    const events = wrapper.emitted('toggle');
    expect(events).toBeTruthy();
    expect(events![0]).toEqual(['pg-0']);
    // 合并组头部不应触发 goto，避免与展开/收起冲突
    expect(wrapper.emitted('goto')).toBeFalsy();
  });

  test('点击单步组（非合并）的「回到」按钮触发 goto，携带该唯一 step 的 index', async () => {
    const wrapper = mount(GroupRow, {
      props: {
        group: makeGroup({ subSteps: [makeStep({ index: 7, applied: true, desc: 'a' })] }),
        expanded: false,
      },
    });
    // 点击头部本身不再触发 goto（整行不可点击）
    await wrapper.find('.m-editor-history-list-group-head').trigger('click');
    expect(wrapper.emitted('goto')).toBeFalsy();
    // 仅点击「回到」按钮才触发 goto
    await wrapper.find('.m-editor-history-list-item-goto').trigger('click');
    expect(wrapper.emitted('goto')).toBeTruthy();
    expect(wrapper.emitted('goto')![0]).toEqual([7]);
    // 单步组没有展开概念，不应触发 toggle
    expect(wrapper.emitted('toggle')).toBeFalsy();
  });

  test('selectEnabled 时点击单步组头部触发 select，携带该 step 的 index', async () => {
    const wrapper = mount(GroupRow, {
      props: {
        group: makeGroup({ subSteps: [makeStep({ index: 5, applied: true, desc: 'a' })] }),
        expanded: false,
        selectEnabled: true,
      },
    });
    await wrapper.find('.m-editor-history-list-group-head').trigger('click');
    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')![0]).toEqual([5]);
  });

  test('selectEnabled 时点击合并组头部同时触发 select 与 toggle', async () => {
    const wrapper = mount(GroupRow, {
      props: {
        group: makeGroup({ subSteps: [makeStep({ index: 3, desc: 'a' }), makeStep({ index: 4, desc: 'b' })] }),
        expanded: false,
        selectEnabled: true,
      },
    });
    await wrapper.find('.m-editor-history-list-group-head').trigger('click');
    // 合并组头部点击：选中组内首步对应节点，同时切换展开
    expect(wrapper.emitted('select')![0]).toEqual([3]);
    expect(wrapper.emitted('toggle')![0]).toEqual(['pg-0']);
  });

  test('selectEnabled 时点击子步行触发 select，携带该子步 index', async () => {
    const wrapper = mount(GroupRow, {
      props: {
        group: makeGroup({ subSteps: [makeStep({ index: 0, desc: 'a' }), makeStep({ index: 1, desc: 'b' })] }),
        expanded: true,
        selectEnabled: true,
      },
    });
    const subItems = wrapper.findAll('.m-editor-history-list-substeps li');
    // 子步倒序渲染：subItems[0] 为 index=1
    await subItems[0].trigger('click');
    expect(wrapper.emitted('select')![0]).toEqual([1]);
  });

  test('未开启 selectEnabled（默认）时点击单步组头部不触发 select', async () => {
    const wrapper = mount(GroupRow, {
      props: {
        group: makeGroup({ subSteps: [makeStep({ index: 5, applied: true, desc: 'a' })] }),
        expanded: false,
      },
    });
    await wrapper.find('.m-editor-history-list-group-head').trigger('click');
    expect(wrapper.emitted('select')).toBeFalsy();
  });

  test('当前单步组（isCurrent=true）点击头部不触发 goto', async () => {
    const wrapper = mount(GroupRow, {
      props: {
        group: makeGroup({ isCurrent: true, subSteps: [makeStep({ index: 0, desc: 'x' })] }),
        expanded: false,
      },
    });
    await wrapper.find('.m-editor-history-list-group-head').trigger('click');
    expect(wrapper.emitted('goto')).toBeFalsy();
  });

  test('当前合并组（isCurrent=true）点击头部仍能 toggle', async () => {
    const wrapper = mount(GroupRow, {
      props: {
        group: makeGroup({
          isCurrent: true,
          subSteps: [makeStep({ index: 0, desc: 'a' }), makeStep({ index: 1, desc: 'b', isCurrent: true })],
        }),
        expanded: false,
      },
    });
    await wrapper.find('.m-editor-history-list-group-head').trigger('click');
    expect(wrapper.emitted('toggle')).toBeTruthy();
    expect(wrapper.emitted('goto')).toBeFalsy();
  });

  test('点击子步「回到」按钮触发 goto 携带该子步 index；当前子步无回到按钮', async () => {
    const wrapper = mount(GroupRow, {
      props: {
        group: makeGroup({
          subSteps: [
            makeStep({ index: 0, applied: true, desc: 'a', isCurrent: true }),
            makeStep({ index: 1, applied: false, desc: 'b' }),
          ],
        }),
        expanded: true,
      },
    });
    // 子步倒序渲染：subItems[0] 为 index=1（非当前，含跳转按钮），subItems[1] 为 index=0（当前，无跳转按钮）
    const subItems = wrapper.findAll('.m-editor-history-list-substeps li');
    expect(subItems[1].find('.m-editor-history-list-item-goto').exists()).toBe(false);
    // 点击子步行本身不再触发 goto
    await subItems[0].trigger('click');
    expect(wrapper.emitted('goto')).toBeFalsy();
    // 仅点击「跳转」按钮才触发 goto
    await subItems[0].find('.m-editor-history-list-item-goto').trigger('click');
    expect(wrapper.emitted('goto')![0]).toEqual([1]);
  });
});
