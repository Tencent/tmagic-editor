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

import { flushPromises, mount } from '@vue/test-utils';
import { ElTable } from 'element-plus';

import Table from '@src/components/table.vue';
import { components } from '@tests/utils';

const mockHandler = jest.fn();
const mockAfter = jest.fn();
const mockFormatter = jest.fn();
const mockErrorFormatter = jest.fn(() => {
  throw new Error('err');
});

const data = {
  data: [
    {
      test: 'test',
      format: 'format',
    },
  ],
  fetch: true,
  errorMsg: '',
  total: 1,
};

const columns = [
  {
    prop: 'test',
    formatter: mockErrorFormatter,
  },
  {
    prop: 'format',
    formatter: mockFormatter,
  },
  {
    actions: [
      {
        text: 'action',
        handler: mockHandler,
        after: mockAfter,
      },
    ],
  },
  {},
];

declare global {
  interface Window {
    ResizeObserver: any;
  }
}

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

const getWrapper = (mockData = data, mockColumns = columns) =>
  mount(Table as any, {
    props: {
      data: mockData,
      config: mockColumns,
    },
    global: {
      components,
      directives: {
        loading: {},
      },
    },
  });

describe('table', () => {
  it('基础', async () => {
    const wrapper = getWrapper();
    const button = wrapper.find('button');
    button.trigger('click');

    await flushPromises();
    expect(mockHandler).toBeCalled();
    expect(mockAfter).toBeCalled();
    expect(mockFormatter).toBeCalled();
    expect(mockErrorFormatter).toBeCalled();
  });

  it('props为空', () => {
    mount(Table, {
      global: {
        components,
        directives: {
          loading: {},
        },
      },
    });
  });

  it('排序', () => {
    const wrapper = getWrapper();
    const table = wrapper.findComponent(ElTable);
    table.vm.$emit('sort-change', {});
    expect(wrapper.emitted()).toHaveProperty('sort-change', [[{}]]);
  });
});
