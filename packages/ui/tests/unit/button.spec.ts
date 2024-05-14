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

import { describe, expect, test } from 'vitest';
import { config, mount } from '@vue/test-utils';

import Button from '../../src/button/index';
import initValue from '../../src/button/src/initValue';
import Text from '../../src/text/index';

config.global.provide = {
  hoc: {
    disabled: false,
  },
};

config.global.components = {
  MagicUiText: Text,
};

describe('ui:button', () => {
  test.skip('ui:button:默认', async () => {
    const wrapper = mount(Button, {
      props: {
        config: {
          id: '1',
          ...initValue,
        },
      },
    });
    expect(wrapper.find('.magic-ui-text').exists()).toBe(true);
    const vm = wrapper.vm as any;
    vm.pushAction((vm: any) => {
      vm.flag = true;
    });
    await wrapper.find('.magic-ui-button').trigger('click');
    expect(vm.flag).toBe(true);
  });

  test.skip('ui:button:preAction失败', async () => {
    const wrapper = mount(Button, {
      props: {
        config: {
          id: '2',
          ...initValue,
          preAction: () => false,
        },
      },
    });
    const vm = wrapper.vm as any;
    vm.pushAction((vm: any) => {
      vm.flag = true;
    });
    await wrapper.find('.magic-ui-button').trigger('click');
    expect(vm.flag).toBe(undefined);
  });
});
