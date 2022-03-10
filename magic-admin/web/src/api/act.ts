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

// 活动相关请求
import fetch, { Res } from '@src/util/request';

// 排序项
export interface OrderItem {
  columnName: string;
  direction: string;
}

// 活动查询参数
export interface ActListQuery {
  where: {
    onlySelf: boolean;
    search: string | string[];
    pageTitle: string;
    actStatus: number;
  };
  orderBy: OrderItem[];
  pgIndex: number;
  pgSize: number;
  userName: string;
}

// 活动复制参数
export interface CopyInfo {
  actId: number;
  userName: string;
}

// 活动创建参数
export interface ActInfoDetail {
  actName: string;
  actBeginTime: string;
  actEndTime: string;
  operator: string;
}

// 活动页面基本信息
export interface PageInfo extends PageListItem {
  id: number;
  actId?: number;
}

export interface PageListItem {
  pageTitle: string;
  pagePublishTime?: string;
  pagePublishStatus: number;
  pagePublishOperator?: string;
}

// 活动列表项
export interface ActListItem {
  actId: number;
  actCryptoId: string;
  actName: string;
  actBeginTime: string;
  actEndTime: string;
  operator: string;
  actStatus: number;
  items: PageInfo[];
  [key: string]: any;
}

// 活动列表返回类型
export interface ActListRes {
  data: ActListItem[];
  total: number;
  fetch: boolean;
  errorMsg: string;
}

export default {
  /**
   * 获取活动列表
   * @param {Object} options
   * @param {ActListQuery} options.data 活动查询参数
   * @returns {Promise<ActListRes>} 查询结果
   */
  getList(options: { data: ActListQuery }): Promise<ActListRes> {
    return fetch.post({
      _c: 'act',
      _a: 'getList',
      ...options,
    });
  },

  /**
   * 新建活动
   * @param {Object} options
   * @param {ActInfoDetail} options.data 新建活动参数：活动基础信息
   * @returns {Promise<Res<{ actId: number }>>} 新活动Id
   */
  saveAct(options: { data: ActInfoDetail }): Promise<Res<{ actId: number }>> {
    return fetch.post({
      _c: 'act',
      _a: 'create',
      ...options,
    });
  },

  /**
   * 复制活动
   * @param {Object} options
   * @param {CopyInfo} options.data 复制活动所需信息
   * @returns {Promise<Res>} 操作结果
   */
  copyAct(options: { data: CopyInfo }): Promise<Res> {
    return fetch.post({
      _c: 'act',
      _a: 'copy',
      ...options,
    });
  },

  /**
   * 根据id获取活动详情
   * @param {Object} params
   * @param {number} options.id 活动ID
   * @returns {Promise<Res>} 查询结果
   */
  getAct(params: { id: number }): Promise<Res> {
    return fetch.get({
      _c: 'act',
      _a: 'get',
      params,
    });
  },

  /**
   * 删除页面
   * @param {Object} options
   * @param {number} options.pageId
   * @returns {Promise<Res>} 删除结果
   */
  removePage(options: { data: { pageId: number } }): Promise<Res> {
    return fetch.post({
      _c: 'act',
      _a: 'removePage',
      ...options,
    });
  },
};
