/*
 * Tencent is pleased to support the open source community by making MagicEditor available.
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

import { h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { ElDrawer } from 'element-plus';

import ActInfoDrawer from '@src/components/act-info-drawer.vue';
import Editor from '@src/views/editor.vue';
import { components } from '@tests/utils';

(window as any).magicPresetConfigs = 'configs';
(window as any).magicPresetValues = 'values';
jest.mock('vue-router');
jest.mock('@src/api/editor', () => ({
  getComponentList: jest.fn(() => ({ ret: 0, data: ['test'] })),
}));
jest.mock('@tmagic/utils', () => ({
  asyncLoadJs: jest.fn(() => Promise.resolve()),
}));
jest.mock('@src/api/act', () => ({
  getAct: jest
    .fn(() => ({
      ret: 0,
      data: {},
    }))
    .mockImplementationOnce(() => ({
      ret: 0,
      data: { pages: [{ srcCode: '{ items: [{ items: ["page"] }] }' }], actInfo: { actId: 1 } },
    }))
    .mockImplementationOnce(() => ({
      ret: 0,
      data: { pages: [{ id: 1, pageTitle: 'index' }], actInfo: { actId: 1 } },
    }))
    .mockImplementationOnce(() => ({
      ret: -1,
      data: {},
    })),
}));

const getWrapper = () =>
  mount(Editor, {
    global: {
      components: {
        ...components,
        'act-info-drawer': ActInfoDrawer,
        'el-drawer': ElDrawer,
        'm-editor': h('div', {
          menu: 'menu',
          runtimeUrl: '/runtime/vue3/playground.html',
          componentGroupList: [],
          model: {
            value: '',
          },
          values: '',
          configs: '',
          defaultSelected: '',
        }),
      },
    },
  });

beforeEach(() => {
  require('vue-router').useRoute.mockReturnValueOnce({ params: { actId: '1' } });
});

describe('Editor', () => {
  it('获取活动配置', async () => {
    const wrapper = getWrapper();
    const { vm } = wrapper;
    await flushPromises();
    const expected = {
      type: 'app',
      items: [
        {
          items: ['page'],
        },
      ],
      abTest: [],
    };
    expect(JSON.stringify(vm.uiConfigs)).toBe(JSON.stringify(expected));
    expect(vm.magicPresetConfigs).toBe('configs');
    expect(vm.magicPresetValues).toBe('values');
  });
  it('设置新的活动配置', async () => {
    const wrapper = getWrapper();
    const { vm } = wrapper;
    await flushPromises();
    const expected = {
      type: 'app',
      items: [
        {
          id: 1,
          type: 'page',
          name: 'index',
          title: 'index',
          style: {
            height: 728,
            width: 375,
          },
          items: [],
        },
      ],
      abTest: [],
    };
    expect(JSON.stringify(vm.uiConfigs)).toBe(JSON.stringify(expected));
  });
  it('获取编辑器左侧组件树', async () => {
    const wrapper = getWrapper();
    const { vm } = wrapper;
    await flushPromises();
    expect(vm.componentList).toContain('test');
  });
});
