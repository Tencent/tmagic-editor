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

import LayerMenu from '@editor/layouts/sidebar/LayerMenu.vue';

globalThis.ResizeObserver =
  globalThis.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

const storeState: any = {
  node: {
    items: [],
    type: 'tabs',
    value: 'test',
  },
};

const componentListService = {
  getList: jest.fn(),
};

const editorService = {
  get: jest.fn((key: string) => storeState[key]),
  add: jest.fn(),
  remove: jest.fn(),
  copy: jest.fn(),
};

const getWrapper = () =>
  mount(LayerMenu as any, {
    global: {
      plugins: [ElementPlus as any],
      provide: {
        services: {
          editorService,
          componentListService,
        },
      },
    },
  });

describe('LayerMenu', () => {
  it('触发subMenu显示', (done) => {
    const wrapper = getWrapper();

    setTimeout(async () => {
      const addDiv = wrapper
        .findAll('div[class="magic-editor-content-menu-item"]')
        .find((dom) => dom.text() === '新增');
      await addDiv?.trigger('mouseenter');

      expect((wrapper.vm as InstanceType<typeof LayerMenu>).subVisible).toBe(true);
      done();
    }, 0);
  });

  it('新增-tab', (done) => {
    const wrapper = getWrapper();
    setTimeout(async () => {
      const tabDiv = wrapper
        .findAll('div[class="magic-editor-content-menu-item"]')
        .find((dom) => dom.text() === '标签');
      await tabDiv?.trigger('click');

      expect(editorService.add.mock.calls[0][0]).toEqual({
        name: undefined,
        type: 'tab-pane',
      });
      done();
    }, 0);
  });

  it('复制', (done) => {
    const wrapper = getWrapper();
    setTimeout(async () => {
      const copyDiv = wrapper
        .findAll('div[class="magic-editor-content-menu-item"]')
        .find((dom) => dom.text() === '复制');
      await copyDiv?.trigger('click');

      expect(editorService.copy.mock.calls[0][0]).toEqual({
        items: [],
        type: 'tabs',
        value: 'test',
      });
      done();
    }, 0);
  });

  it('删除', (done) => {
    const wrapper = getWrapper();
    setTimeout(async () => {
      const removeDiv = wrapper
        .findAll('div[class="magic-editor-content-menu-item"]')
        .find((dom) => dom.text() === '删除');
      await removeDiv?.trigger('click');

      expect(editorService.remove.mock.calls[0][0]).toEqual({
        items: [],
        type: 'tabs',
        value: 'test',
      });
      done();
    }, 0);
  });
});
