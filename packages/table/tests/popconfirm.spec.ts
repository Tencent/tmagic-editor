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

import { setDesignConfig } from '@tmagic/design';

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
    expect(popper.style.width).toBe('240px');

    wrapper.unmount();
  });
});
