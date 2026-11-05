/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';

// 必须与 setDesignConfig 来自同一模块实例：从 @tmagic/design/src 导入 src/Popconfirm.vue 时，
// 它读取的是源码里独立的 config 模块，未注入 adapter 就会退化成原生的 <el-popconfirm> 标签。
import { setDesignConfig, TMagicPopconfirm } from '@tmagic/design';

import elementPlusAdapter from '../../element-plus-adapter/src/index';
import ActionsColumn from '../src/ActionsColumn.vue';

setDesignConfig(elementPlusAdapter);

describe('ActionsColumn popconfirm (real element-plus)', () => {
  test('点击按钮弹出 Popconfirm，确认后触发 handler', async () => {
    const handler = vi.fn();
    const wrapper = mount(ActionsColumn, {
      props: {
        columns: [],
        config: {
          actions: [
            {
              text: '删除',
              buttonType: 'danger',
              popconfirm: true,
              confirmText: (row: any) => `确定删除${row.title}?`,
              handler,
            },
          ],
        },
        row: { title: 't1' },
        index: 0,
        editState: [],
      } as any,
      attachTo: document.body,
    });

    const btn = wrapper.findAll('.action-btn').find((b) => b.text().includes('删除'));
    await btn?.trigger('click');

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('确定删除t1?');
    });

    const confirmBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim().toLowerCase() === 'yes',
    );
    confirmBtn?.click();
    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledWith({ title: 't1' }, 0);
    });

    wrapper.unmount();
  });

  test('popconfirmWidth 透传到浮层宽度', async () => {
    const handler = vi.fn();
    const wrapper = mount(ActionsColumn, {
      props: {
        columns: [],
        config: {
          actions: [
            {
              text: '删除',
              popconfirm: true,
              popconfirmWidth: 240,
              confirmText: '确定删除?',
              handler,
            },
          ],
        },
        row: {},
        index: 0,
        editState: [],
      } as any,
      attachTo: document.body,
    });

    const btn = wrapper.findAll('.action-btn').find((b) => b.text().includes('删除'));
    await btn?.trigger('click');

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('确定删除?');
    });

    const popper = Array.from(document.querySelectorAll('.el-popper')).find((e) =>
      (e.textContent || '').includes('确定删除?'),
    );
    expect(popper).toBeTruthy();
    expect(popper?.style.width).toBe('240px');

    wrapper.unmount();
  });
});

describe('TMagicPopconfirm placement（真实 element-plus）', () => {
  const mountPopconfirm = (placement: string) =>
    mount(TMagicPopconfirm, {
      props: { title: '确认内容', placement } as any,
      slots: { reference: '<button class="ref">ref</button>' },
      attachTo: document.body,
    });

  test.each([
    ['right', 'right'],
    ['right-top', 'right-start'],
    ['top-left', 'top-start'],
  ])('placement=%s 作用到 popper 的 %s', async (placement, expected) => {
    const wrapper = mountPopconfirm(placement);
    await wrapper.find('.ref').trigger('click');
    // 取最后挂载的 popper，避免命中此前用例残留的浮层
    const popper = () => Array.from(document.querySelectorAll('.el-popper')).at(-1);
    await vi.waitFor(() => {
      expect(popper()?.getAttribute('data-popper-placement')).toBe(expected);
    });
    wrapper.unmount();
  });

  test('默认 teleported=true，浮层挂到 body 而非内联渲染', async () => {
    const wrapper = mountPopconfirm('right');
    expect(wrapper.props('teleported')).toBe(true);
    await wrapper.find('.ref').trigger('click');
    await vi.waitFor(() => {
      expect(document.querySelector('.el-popper')).toBeTruthy();
    });
    expect(wrapper.element.contains(document.querySelector('.el-popper')!)).toBe(false);
    wrapper.unmount();
  });
});
