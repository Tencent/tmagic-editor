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

// 活动状态
export enum ActStatus {
  ALL = -1, // 查询传参使用：全部状态占位
  MODIFYING, // 修改中
  PART_PUBLISHED, // 部分页面已发布
  PUBLISHED, // 全部页面已发布
}

// 页面状态
export enum PageStatus {
  MODIFYING = 0, // 修改中
  PUBLISHED, // 已预发布
}
