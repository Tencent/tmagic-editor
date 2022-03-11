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

import vueRouter from 'vue-router';
import { mount } from '@vue/test-utils';

import Aside from '@src/components/aside.vue';
import type { AsideState } from '@src/typings';
import { components } from '@tests/utils';

jest.mock('vue-router', () => {
  let path = '/act/my/0';
  return {
    setRoute: (newPath: string) => (path = newPath),
    useRoute: jest.fn(() => ({ path })),
  };
});

const getWrapper = (
  aside: AsideState = {
    data: [
      {
        id: 1,
        url: '/act',
        icon: 'el-icon-date',
        text: '活动管理',
        items: [
          {
            id: 101,
            url: '/create',
            icon: '',
            text: '新建活动',
          },
          {
            id: 102,
            url: '/my',
            icon: '',
            text: '我的活动',
          },
          {
            id: 103,
            url: '/all',
            icon: '',
            text: '全部活动',
          },
        ],
      },
    ],
    collapse: false,
  },
) =>
  mount(Aside, {
    global: {
      components,
      provide: {
        aside,
      },
    },
  });

describe('Aside', () => {
  it('渲染菜单', () => {
    const wrapper = getWrapper();
    expect(wrapper.findAll('[class="el-sub-menu__title"]').length).toBe(1);
    expect(wrapper.findAll('[role="menuitem"]').length).toBe(4);
    // 当前路由对应的菜单项高亮：我的活动
    expect(wrapper.find('[class="el-menu-item is-active"]').text()).toBe('我的活动');
  });

  it('空菜单', () => {
    const aside: AsideState = { data: [], collapse: false };
    const wrapper = getWrapper(aside);
    expect(wrapper.find('[class="el-sub-menu__title"]').exists()).toBe(false);
    expect(wrapper.find('[class="el-menu-item"]').exists()).toBe(false);
  });

  it('当前路由下对应的菜单项高亮：全部活动', () => {
    (vueRouter as any).setRoute('/act/all/0');
    const wrapper = getWrapper();
    expect(wrapper.find('[class="el-menu-item is-active"]').text()).toBe('全部活动');
  });

  it('当前路由下对应的菜单项高亮：创建活动', () => {
    (vueRouter as any).setRoute('/act/create');
    const wrapper = getWrapper();
    expect(wrapper.find('[class="el-menu-item is-active"]').text()).toBe('新建活动');
  });

  it('高度适应窗口变化', () => {
    window.dispatchEvent(new Event('resize'));
  });
});
