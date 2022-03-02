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

// 保存发布的相关路由
import Router from 'koa-router';

import PublishController from '@src/controller/publish';

const router = new Router();
// 保存活动基础信息
router.post('/saveActInfo', PublishController.saveActInfo);

// 发布
router.post('/publish', PublishController.publish);

export default router;
