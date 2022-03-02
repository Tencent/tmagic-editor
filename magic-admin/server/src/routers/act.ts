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

// 活动列表相关路由
import Router from 'koa-router';

import actController from '@src/controller/act';

const router = new Router();
// 拉取编辑器左侧展示的组件列表
router.post('/getList', actController.getList);

// 创建活动
router.post('/create', actController.create);

// 复制活动
router.post('/copy', actController.copy);

// 根据id获取活动信息
router.get('/get', actController.getInfo);

// 删除活动页面
router.post('/removePage', actController.removePage);

export default router;
