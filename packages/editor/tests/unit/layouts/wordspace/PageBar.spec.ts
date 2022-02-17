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

import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

import PageBar from '@editor/layouts/workspace/PageBar.vue';

const editorState: Record<string, any> = {
  root: {
    items: [{ key: 0, id: 1, name: 'testName', type: 'page' }],
  },
  page: { id: 1, type: 'page' },
};

const editorService = {
  get: jest.fn((key: string) => editorState[key]),
  add: jest.fn(),
  set: jest.fn(),
  select: jest.fn(),
};

const getWrapper = () =>
  mount(PageBar as any, {
    global: {
      plugins: [ElementPlus as any],
      provide: {
        services: {
          editorService,
        },
      },
    },
  });

describe('PageBar', () => {
  it('新增page', (done) => {
    const wrapper = getWrapper();
    setTimeout(async () => {
      await wrapper.find('i[class="el-icon m-editor-page-bar-menu-add-icon"]').trigger('click');

      expect(editorService.add.mock.calls[0][0]).toEqual({
        type: 'page',
        name: 'page_1',
      });
      done();
    }, 0);
  });

  it('切换page', (done) => {
    const wrapper = getWrapper();
    setTimeout(async () => {
      await wrapper.find('div[class="m-editor-page-bar-item active"]').trigger('click');

      expect(editorService.set.mock.calls).toEqual([]);
      done();
    }, 0);
  });
});
