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

import { reactive } from 'vue';

import type { ComponentGroup, ComponentGroupState } from '@editor/type';

import BaseService from './BaseService';

class ComponentList extends BaseService {
  private state = reactive<ComponentGroupState>({
    list: [],
  });

  constructor() {
    super([]);
  }

  /**
   * @param componentGroupList 组件列表配置
   */
  public setList(componentGroupList: ComponentGroup[]): void {
    this.state.list = componentGroupList;
  }

  public getList(): ComponentGroup[] {
    return this.state.list;
  }

  public resetState() {
    this.state.list = [];
  }

  public destroy() {
    this.resetState();
    this.removeAllListeners();
    this.removeAllPlugins();
  }
}

export type ComponentListService = ComponentList;

export default new ComponentList();
