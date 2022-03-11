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

// 编辑器左侧边栏表单配置
export const AsideFormConfig = {
  data: [
    {
      id: 1,
      url: '/act',
      icon: 'el-icon-date',
      text: '活动管理',
      items: [
        {
          id: 101,
          url: '/create',
          icon: '',
          text: '新建活动',
        },
        {
          id: 102,
          url: '/my',
          icon: '',
          text: '我的活动',
        },
        {
          id: 103,
          url: '/all',
          icon: '',
          text: '全部活动',
        },
      ],
    },
  ],
  collapse: false,
};
