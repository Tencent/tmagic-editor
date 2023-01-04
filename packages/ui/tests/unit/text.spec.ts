/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
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

import { config, mount } from '@vue/test-utils';

import Text from '../../src/text/index';
import initValue from '../../src/text/src/initValue';

config.global.provide = {
  hoc: {
    disabled: false,
  },
};

describe('ui:text', () => {
  it('ui:text:默认状态', () => {
    const wrapper = mount(Text, {
      props: {
        config: initValue,
      },
    });
    expect(wrapper.find('.magic-ui-text').text()).toBe(initValue.text);
  });

  it('ui:text:置灰状态', () => {
    const wrapper = mount(Text, {
      props: {
        config: {
          ...initValue,
          disabledText: '置灰状态',
        },
      },
      global: {
        provide: {
          hoc: {
            disabled: true,
          },
        },
      },
    });
    expect(wrapper.find('.magic-ui-text').text()).toBe('置灰状态');
  });

  it('ui:text:变量', () => {
    const wrapper = mount(Text, {
      props: {
        config: {
          ...initValue,
          text: '{{var1}}',
        },
        vars: {
          var1: '变量',
        },
      },
    });
    expect(wrapper.find('.magic-ui-text').text()).toBe('变量');
  });

  it('ui:text:text函数', () => {
    const wrapper = mount(Text, {
      props: {
        config: {
          ...initValue,
          text: () => '函数返回文字',
        },
      },
    });
    expect(wrapper.find('.magic-ui-text').text()).toBe('函数返回文字');
  });

  it('ui:text:multiple', () => {
    const wrapper = mount(Text, {
      props: {
        config: {
          ...initValue,
          multiple: false,
        },
      },
    });
    expect(wrapper.find('.magic-ui-text.magic-ui-text--single-line').exists()).toBe(true);
  });

  it('ui:text:slot', () => {
    const wrapper = mount(Text, {
      props: {
        config: initValue,
      },
      slots: {
        default: 'Default',
      },
    });
    expect(wrapper.find('.magic-ui-text').text()).toBe('Default');
  });
});
