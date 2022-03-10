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

// 编辑器相关路由
import Router from 'koa-router';

import editorController from '@src/controller/editor';

const router = new Router();
// 拉取编辑器左侧展示的组件列表
router.get('/getComponentList', editorController.getComponentList);

// 拉取活动配置的web插件
router.get('/getWebPlugins', editorController.getWebPlugins);

export default router;
