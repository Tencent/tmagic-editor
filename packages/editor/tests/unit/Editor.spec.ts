/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
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
import ElementPlus from 'element-plus';

import MagicForm from '@tmagic/form';
import { NodeType } from '@tmagic/schema';

import Editor from '@editor/Editor.vue';

vi.mock('@editor/utils/logger', () => ({
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
}));

globalThis.ResizeObserver =
  globalThis.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }));

describe.skip('编辑器', () => {
  test('初始化', () => {
    const wrapper = mount(Editor as any, {
      global: {
        plugins: [ElementPlus as any, MagicForm as any],
      },
      props: {
        modelValue: {
          type: NodeType.ROOT,
          id: 1,
          name: 'app',
          items: [
            {
              type: NodeType.PAGE,
              id: 2,
              name: NodeType.PAGE,
              items: [],
            },
          ],
        },
        runtimeUrl: 'https://m.film.qq.com/magic-ui/production/1/1625056093304/magic/magic-ui.umd.min.js',
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
