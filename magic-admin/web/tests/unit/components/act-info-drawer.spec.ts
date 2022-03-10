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
import magicStore from '@src/store/index';
import { components } from '@tests/utils';
const pages = [
  {
    pageName: 'index',
  },
  {
    pageName: 'page1',
  },
];
const actInfo = {
  abTest: [
    {
      name: 'index',
      pageList: [
        {
          pageName: 'index',
        },
      ],
    },
  ],
};
const getWrapper = () =>
  mount(ActInfoDrawer, {
    global: {
      components: {
        ...components,
        'el-drawer': ElDrawer,
        'm-form': h('div', {
          initValues: {},
          config: {},
          change: jest.fn(() => {}),
        }),
      },
    },
  });
magicStore.set('pages', pages);
magicStore.set('actInfo', actInfo);

describe('ActInfoDrawer', () => {
  it('活动配置抽屉页默认收起来', () => {
    const wrapper = getWrapper();
    const elDrawer = wrapper.findComponent(ElDrawer);
    expect(elDrawer.exists()).toBe(true);
    expect(elDrawer.isVisible()).toBe(false);
  });
  it('活动配置抽屉页点击展开', async () => {
    const wrapper = getWrapper();
    const { vm } = wrapper;
    vm.appDrawerVisibility = false;
    await wrapper.findComponent({ ref: 'showActInfo' }).trigger('click');
    expect(vm.appDrawerVisibility).toBe(true);
  });
  it('表格提交正确', async () => {
    const wrapper = getWrapper();
    const mockForm = {
      resetForm: jest.fn(),
      submitForm: jest.fn(() => 'test'),
    };
    const { vm } = wrapper;
    vm.configForm = mockForm;
    vm.configChangeHandler();
    expect(vm.values).toStrictEqual(actInfo);
    await flushPromises();
    expect(magicStore.get('actInfo')).toBe('test');
  });
  it('表格提交失败', async () => {
    const wrapper = getWrapper();
    const mockForm = {
      resetForm: jest.fn(),
      submitForm: jest.fn(() => {
        throw Error('submit form fail');
      }),
    };
    const { vm } = wrapper;
    vm.configForm = mockForm;
    vm.configChangeHandler();
    await flushPromises();
    expect(document.querySelector('.el-message')).toBeTruthy();
    expect(document.querySelector('.el-message')?.textContent).toBe('submit form fail');
  });
});
