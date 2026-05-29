/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import Table from '@form/containers/table/Table.vue';
import MagicForm from '@form/index';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

// el-table 在 happy-dom 下的 MutationObserver 会报错，这里直接 stub 掉表格本体；
// 导入 / 清空 / 新增按钮的显隐只取决于 importable & isCompare，与表格渲染无关。
const mountTable = (props: any) =>
  mount(Table as any, {
    global: {
      plugins: [ElementPlus as any, MagicForm as any],
      // 设计层 TMagicTable 组件名为 TMTable，底层渲染 el-table，故按真实名 stub
      stubs: { TMTable: true, TMagicTable: true, ElTable: true },
    },
    props: {
      name: 'list',
      prop: 'list',
      config: { type: 'table', name: 'list', importable: true, items: [{ name: 'text', type: 'text' }] },
      model: { list: [{ text: 'a' }] },
      ...props,
    },
  });

describe('Table container —— 对比模式', () => {
  test('非对比模式展示「清空」等导入相关按钮', async () => {
    const wrapper = mountTable({ isCompare: false });
    await nextTick();
    expect(wrapper.text()).toContain('清空');
  });

  test('对比模式隐藏「清空」等导入相关按钮', async () => {
    const wrapper = mountTable({ isCompare: true, lastValues: { list: [{ text: 'a' }] } });
    await nextTick();
    expect(wrapper.text()).not.toContain('清空');
  });
});
