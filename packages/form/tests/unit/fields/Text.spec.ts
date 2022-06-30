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
import { describe, expect, test } from 'vitest';
import { mount } from '@vue/test-utils';
import ElementPlus, { ElButton } from 'element-plus';

import MagicForm, { MForm, MText } from '../../../src';

/**
 * 获取mock的Text实例
 * @param config 配置
 * @param initValues 初始值
 * @returns 实例
 */
const getWrapper = (
  config: any = [
    {
      text: 'text',
      type: 'text',
      name: 'text',
    },
  ],
  initValues: any = {
    text: 'text',
  },
) =>
  mount(MForm, {
    global: {
      plugins: [ElementPlus as any, MagicForm as any],
    },
    props: {
      initValues,
      config,
    },
  });

describe('Text', () => {
  test('基础', (done) => {
    const wrapper = getWrapper();

    setTimeout(async () => {
      const text = wrapper.findComponent(MText);
      expect(text.exists()).toBe(true);
      const value = await (wrapper.vm as any).submitForm();
      // 默认值
      expect(value.text).toBe('text');
      done();
    }, 0);
  });

  test('append string', (done) => {
    const wrapper = getWrapper([
      {
        text: 'text',
        type: 'text',
        name: 'text',
        append: 'appendText',
      },
    ]);

    setTimeout(async () => {
      expect(wrapper.text()).toContain('appendText');
      done();
    }, 0);
  });

  test('append button', (done) => {
    // 用来标识append按钮是否有点击
    let clickFlag = false;
    const wrapper = getWrapper([
      {
        text: 'text',
        type: 'text',
        name: 'text',
        append: {
          text: 'appendText',
          type: 'button',
          handler: () => (clickFlag = true),
        },
      },
    ]);

    setTimeout(async () => {
      expect(wrapper.text()).toContain('appendText');
      const button = wrapper.findComponent(ElButton);
      expect(clickFlag).toBe(false);
      await button.trigger('click');
      expect(clickFlag).toBe(true);
      done();
    }, 0);
  });

  test('key ArrowUp', (done) => {
    const wrapper = getWrapper(
      [
        {
          text: 'text',
          type: 'text',
          name: 'text',
          filter: 'number',
        },
      ],
      {
        text: 0,
      },
    );

    setTimeout(async () => {
      // 点击键盘上键
      await wrapper.find('input').trigger('keyup', {
        key: 'ArrowUp',
      });
      const value = await (wrapper.vm as any).submitForm();
      expect(value.text).toBe(1);
      done();
    }, 0);
  });

  test('key ArrowDown', (done) => {
    const wrapper = getWrapper(
      [
        {
          text: 'text',
          type: 'text',
          name: 'text',
          filter: 'number',
        },
      ],
      {
        text: 0,
      },
    );

    setTimeout(async () => {
      // 点击键盘下键
      await wrapper.find('input').trigger('keyup', {
        key: 'ArrowDown',
      });
      const value = await (wrapper.vm as any).submitForm();
      expect(value.text).toBe(-1);
      done();
    }, 0);
  });

  test('key ctrlKey ArrowUp', (done) => {
    const wrapper = getWrapper(
      [
        {
          text: 'text',
          type: 'text',
          name: 'text',
          filter: 'number',
        },
      ],
      {
        text: 0,
      },
    );

    setTimeout(async () => {
      // 点击键盘ctrl + 上键
      await wrapper.find('input').trigger('keyup', {
        key: 'ArrowUp',
        ctrlKey: true,
      });
      const value = await (wrapper.vm as any).submitForm();
      expect(value.text).toBe(100);
      done();
    }, 0);
  });

  test('key ctrlKey ArrowDown', (done) => {
    const wrapper = getWrapper(
      [
        {
          text: 'text',
          type: 'text',
          name: 'text',
          filter: 'number',
        },
      ],
      {
        text: 0,
      },
    );

    setTimeout(async () => {
      // 点击键盘ctrl + 下键
      await wrapper.find('input').trigger('keyup', {
        key: 'ArrowDown',
        ctrlKey: true,
      });
      const value = await (wrapper.vm as any).submitForm();
      expect(value.text).toBe(-100);
      done();
    }, 0);
  });

  test('key shiftKey ArrowUp', (done) => {
    const wrapper = getWrapper(
      [
        {
          text: 'text',
          type: 'text',
          name: 'text',
          filter: 'number',
        },
      ],
      {
        text: 0,
      },
    );

    setTimeout(async () => {
      // 点击键盘shift + 上键
      await wrapper.find('input').trigger('keyup', {
        key: 'ArrowUp',
        shiftKey: true,
      });
      const value = await (wrapper.vm as any).submitForm();
      expect(value.text).toBe(10);
      done();
    }, 0);
  });

  test('key shiftKey ArrowDown', (done) => {
    const wrapper = getWrapper(
      [
        {
          text: 'text',
          type: 'text',
          name: 'text',
          filter: 'number',
        },
      ],
      {
        text: 0,
      },
    );

    setTimeout(async () => {
      // 点击键盘shift + 下键
      await wrapper.find('input').trigger('keyup', {
        key: 'ArrowDown',
        shiftKey: true,
      });
      const value = await (wrapper.vm as any).submitForm();
      expect(value.text).toBe(-10);
      done();
    }, 0);
  });

  test('key altKey ArrowUp', (done) => {
    const wrapper = getWrapper(
      [
        {
          text: 'text',
          type: 'text',
          name: 'text',
          filter: 'number',
        },
      ],
      {
        text: 0,
      },
    );

    setTimeout(async () => {
      // 点击键盘alt + 上键
      await wrapper.find('input').trigger('keyup', {
        key: 'ArrowUp',
        altKey: true,
      });
      const value = await (wrapper.vm as any).submitForm();
      expect(value.text).toBe(0.1);
      done();
    }, 0);
  });

  test('key altKey ArrowDown', (done) => {
    const wrapper = getWrapper(
      [
        {
          text: 'text',
          type: 'text',
          name: 'text',
          filter: 'number',
        },
      ],
      {
        text: 0,
      },
    );

    setTimeout(async () => {
      // 点击键盘alt + 下键
      await wrapper.find('input').trigger('keyup', {
        key: 'ArrowDown',
        altKey: true,
      });
      const value = await (wrapper.vm as any).submitForm();
      expect(value.text).toBe(-0.1);
      done();
    }, 0);
  });
});
