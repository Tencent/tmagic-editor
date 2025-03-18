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

import { ConcreteComponent, inject } from 'vue-demi';

import type TMagicApp from '@tmagic/core';
import { toLine } from '@tmagic/core';

interface UseComponentOptions {
  /** 组件类型 */
  componentType?: string;
  /** App 实例 */
  app?: TMagicApp;
}

/**
 * 通过组件类型在 App 内获取组件
 * @param options 若为字符串则为组件类型，若为对象则为参数选项
 * @returns 得到的组件，若未找到则返回带 magic-ui- 前缀的组件类型
 */
export function useComponent<C extends ConcreteComponent = ConcreteComponent>(
  options: string | UseComponentOptions = '',
) {
  let componentType: string | undefined;
  let app: TMagicApp | undefined;
  let component: C | undefined;

  if (typeof options === 'string') {
    componentType = options;
  } else {
    ({ componentType, app } = options);
  }

  if (!componentType || componentType === '') {
    componentType = 'container';
  }

  if (!app) {
    app = inject<TMagicApp>('app');
  }

  component = app?.resolveComponent(componentType);

  if (!component && !componentType.startsWith('magic-ui-')) {
    componentType = `magic-ui-${toLine(componentType)}`;
    component = app?.resolveComponent(componentType);
  }

  return component ?? componentType;
}
