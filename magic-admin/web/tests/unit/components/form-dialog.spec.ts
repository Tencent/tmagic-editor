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
import { ElDialog } from 'element-plus';

import FormDialog from '@src/components/form-dialog.vue';
import { components } from '@tests/utils';

const getWrapper = (
  formProps: any = {
    values: {
      text: 'test',
    },
    config: [{ name: 'text', text: '测试输入' }],
    visible: true,
    action: jest.fn(() => ({ ret: 0 })),
    title: '测试',
  },
) =>
  mount(FormDialog, {
    props: formProps,
    global: {
      components: {
        ...components,
        'el-dialog': ElDialog,
      },
    },
  });

describe('FormDialog', () => {
  it('关闭对话框', async () => {
    const wrapper = getWrapper();
    const dialog = wrapper.findComponent(ElDialog);
    (dialog.vm.$props as any).beforeClose();
    expect(wrapper.emitted()).toHaveProperty('close');
  });

  it('保存活动-成功', async () => {
    const wrapper = getWrapper();

    const mockForm = {
      resetForm: jest.fn(),
      submitForm: jest.fn(() => 'test'),
    };
    (wrapper.vm as any).form = mockForm;
    wrapper.vm.save();
    await flushPromises();
    expect(wrapper.emitted()).toHaveProperty('close');
    expect(wrapper.emitted()).toHaveProperty('afterAction');
    expect((wrapper.emitted() as any).afterAction[0][0]).toEqual({ ret: 0 });
  });

  it('保存活动-请求出错', async () => {
    const failProps = {
      values: {
        text: 'test',
      },
      config: [{ name: 'text', text: '测试输入' }],
      visible: true,
      action: jest.fn(() => ({ ret: -1 })),
      title: '测试',
    };
    const wrapper = getWrapper(failProps);
    const mockForm = {
      resetForm: jest.fn(),
      submitForm: jest.fn(() => 'test'),
    };
    (wrapper.vm as any).form = mockForm;
    wrapper.vm.save();
  });

  it('保存活动-返回参数为空', async () => {
    const failProps = {
      values: {
        text: 'test',
      },
      config: [{ name: 'text', text: '测试输入' }],
      visible: true,
      action: jest.fn(), // 返回为空
      title: '测试',
    };
    const wrapper = getWrapper(failProps);
    const mockForm = {
      resetForm: jest.fn(),
      submitForm: jest.fn(() => 'test'),
    };
    (wrapper.vm as any).form = mockForm;
    wrapper.vm.save();
    await flushPromises();
    expect(wrapper.emitted()).toHaveProperty('close');
  });

  it('保存活动-表单内容为空', async () => {
    const wrapper = getWrapper();
    const mockForm = {
      resetForm: jest.fn(),
      submitForm: jest.fn(() => {}),
    };
    (wrapper.vm as any).form = mockForm;
    wrapper.vm.save();
    await flushPromises();
    expect(wrapper.emitted()).toHaveProperty('close');
  });

  it('空参数测试', () => {
    const wrapper = getWrapper({});
    expect(wrapper.vm.$props).toEqual({
      values: {},
      config: [],
      visible: false,
      title: undefined,
      action: undefined,
    });
  });
});
