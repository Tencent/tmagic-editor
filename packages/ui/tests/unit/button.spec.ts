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
  it('ui:button:默认', async () => {
    const wrapper = mount(Button, {
      props: {
        config: initValue,
      },
    });
    expect(wrapper.find('.magic-ui-text').exists()).toBe(true);
    wrapper.vm.pushAction((vm: any) => {
      vm.flag = true;
    });
    await wrapper.find('.magic-ui-button').trigger('click');
    expect(wrapper.vm.flag).toBe(true);
  });

  it('ui:button:preAction失败', async () => {
    const wrapper = mount(Button, {
      props: {
        config: {
          ...initValue,
          preAction: () => false,
        },
      },
    });
    wrapper.vm.pushAction((vm: any) => {
      vm.flag = true;
    });
    await wrapper.find('.magic-ui-button').trigger('click');
    expect(wrapper.vm.flag).toBe(undefined);
  });
});
