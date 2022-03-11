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

import { mount } from '@vue/test-utils';

import Header from '@src/components/header.vue';

const getWrapper = () =>
  mount(Header, {
    global: {
      provide: {
        aside: {
          data: [
            {
              id: 101,
              url: '/create',
              icon: '',
              text: '新建活动',
            },
          ],
          collapse: false,
        },
      },
      mocks: {
        $route: {
          meta: {
            hideAside: false,
          },
        },
      },
    },
  });

jest.mock('js-cookie', () => ({
  get: jest.fn(() => 'testName'),
}));

describe('Header', () => {
  it('侧边栏折叠', async () => {
    const wrapper = getWrapper();
    await wrapper.find('[class="aside-trigger"]').trigger('click');

    expect(wrapper.emitted()).toHaveProperty('asideTrigger');
    expect(wrapper.find('i').attributes('class')).toBe('el-icon-s-fold');
  });
});
