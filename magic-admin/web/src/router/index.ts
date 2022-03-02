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

import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
const routes: Array<RouteRecordRaw> = [
  // 活动列表路由
  {
    path: '/',
    redirect: '/act/my/0',
  },
  {
    path: '/act/:type/:page?/:status?/:query?',
    name: 'ActList',
    component: () => import('@src/views/list-view.vue'),
  },
  {
    path: '/act/create',
    name: 'NewAct',
    component: () => import('@src/views/template-list.vue'),
  },
  // 编辑器路由
  {
    path: '/editor/:actId',
    name: 'Editor',
    meta: {
      hideAside: true,
    },
    component: () => import(/* webpackChunkName: "editor" */ '@src/views/editor.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
