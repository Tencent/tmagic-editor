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

import type { ActInfo } from '@src/typings';
import fetch, { Res } from '@src/util/request';

export default {
  /**
   * 保存活动
   * @param {Object} options
   * @param {Object} options.data
   * @param {ActInfo} options.data.actInfo 活动基本信息
   * @param {string} options.data.rootInfo 页面组件配置信息
   * @returns {Promise<Res>} 保存结果
   */
  saveActInfo(options: { data: { actInfo: ActInfo; rootInfo: string } }): Promise<Res> {
    return fetch.post({
      _c: 'publish',
      _a: 'saveActInfo',
      ...options,
    });
  },

  /**
   * 发布活动
   * @param {Object} options
   * @param {Object} options.data
   * @param {number} options.data.actId 活动ID
   * @param {string[]} options.data.publishPages 待发布的页面
   * @param {string} options.data.rootInfo 页面组件配置信息
   * @returns {Promise<Res>} 发布结果
   */
  publishPage(options: { data: { actId: number; publishPages: string[]; rootInfo: string } }): Promise<Res> {
    return fetch.post({
      _c: 'publish',
      _a: 'publish',
      ...options,
    });
  },
};
