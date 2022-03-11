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
import { shallowMount } from '@vue/test-utils';

import ActCreateCard from '@src/components/act-created-card.vue';
import TemplateList from '@src/views/template-list.vue';

jest.mock('vue-router', () => {
  let route = {};
  return {
    useRoute: jest.fn(() => route),
    useRouter: jest.fn(() => ({
      push: jest.fn((newRoute) => {
        route = newRoute;
      }),
    })),
  };
});

describe('ListView', () => {
  it('基础', () => {
    const wrapper = shallowMount(TemplateList);
    const actSelect = wrapper.findComponent(ActCreateCard);
    actSelect.trigger('add');
    expect(vueRouter.useRoute()).toEqual({
      path: '/act/my',
      query: {
        create: 'true',
      },
    });
  });
});
