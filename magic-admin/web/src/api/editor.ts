/**
 * Tencent is pleased to support the open source community by making MagicAdmin available.
 * Copyright (C) 2022 THL A29 Limited, a Tencent company. All rights reserved.
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import fetch, { Res } from '@src/util/request';
// 编辑器左侧组件分类
export interface CompClassifyForEditor {
  title: string;
  items: CompListInClassify[];
}

// 编辑器左侧组件列表
export interface CompListInClassify {
  icon: string;
  id: number;
  renderType: number;
  reportType: string;
  text: string;
  type: string;
}

export default {
  /**
   * 获取组件列表
   * @returns {Promise<Res>} 查询结果
   */
  getComponentList(): Promise<Res> {
    return fetch.get({
      _c: 'editor',
      _a: 'getComponentList',
    });
  },
};
