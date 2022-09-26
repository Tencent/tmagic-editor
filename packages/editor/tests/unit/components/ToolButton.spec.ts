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
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import ElementPlus, { ElDropdown } from 'element-plus';

import ToolButton from '@editor/components/ToolButton.vue';
import uiService from '@editor/services/ui';

// ResizeObserver mock
globalThis.ResizeObserver =
  globalThis.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }));

const editorState: Record<string, any> = {
  node: 'node',
};

// mock
const editorService = {
  get: vi.fn((key: string) => editorState[key]),
  remove: vi.fn(),
  redo: vi.fn(),
  undo: vi.fn(),
};

// mock
const historyService = {
  state: {
    canUndo: true,
    canRedo: true,
  },
};

const getWrapper = (
  props: any = {
    data: 'delete',
  },
) =>
  mount(ToolButton, {
    props,
    global: {
      plugins: [ElementPlus as any],
      provide: {
        services: {
          editorService,
          historyService,
          uiService,
        },
      },
    },
  });

describe('ToolButton', () => {
  test('data无匹配值', () => {
    getWrapper({ data: 'default' });
  });

  test('自定义display', () => {
    const display = vi.fn();
    getWrapper({
      data: { display },
    });
    expect(display).toBeCalled();
  });

  test('点击下拉菜单项', async () => {
    const wrapper = getWrapper({
      data: {
        type: 'dropdown',
      },
    });

    await nextTick();

    const dropDown = wrapper.findComponent(ElDropdown);
    const handler = vi.fn();
    dropDown.vm.$emit('command', {
      item: { handler },
    });
    expect(handler).toBeCalled();
  });

  test('按钮不可用', async () => {
    const wrapper = getWrapper({
      data: {
        icon: 'disabled-icon',
        type: 'button',
        disabled: true,
      },
    });

    await nextTick();

    // disabled 后会有 is-disabled class
    const iconBtn = wrapper.find('.el-button.is-text.is-disabled');
    expect(iconBtn).toBeDefined();
  });

  test('菜单项handler未定义', () => {
    const wrapper = getWrapper({
      data: {
        type: 'dropdown',
      },
    });

    const dropDown = wrapper.findComponent(ElDropdown);
    dropDown.vm.$emit('command', {
      item: {},
    });
  });

  test('参数data为undefined', () => {
    const wrapper = getWrapper({ data: undefined });
    expect(wrapper.find('div[class="menu-item"]').exists()).toBe(false);
  });

  test('自定义display', () => {
    const wrapper = getWrapper({
      data: {
        display: false,
      },
    });
    expect(wrapper.find('div[class="menu-item"]').exists()).toBe(false);
  });
});
