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

// 整合所有子路由
import Router from 'koa-router';

import act from '@src/routers/act';
import editor from '@src/routers/editor';
import publish from '@src/routers/publish';

const router = new Router({
  prefix: '/api',
});
// 编辑器相关路由
router.use('/editor', editor.routes(), editor.allowedMethods());

// 活动列表相关路由
router.use('/act', act.routes(), act.allowedMethods());

// 保存发布相关路由
router.use('/publish', publish.routes(), publish.allowedMethods());

export default router;
