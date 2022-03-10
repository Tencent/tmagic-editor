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

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { getLogger } from 'log4js';

import routers from '@src/routers';
import staticRouters from '@src/routers/static';
const app = new Koa();
const { PORT } = process.env;

app.use(
  bodyParser({
    formLimit: '10mb',
    jsonLimit: '10mb',
  }),
);
app.use(async (ctx, next) => {
  ctx.logger = getLogger();
  ctx.logger.level = 'debug';
  await next();
});
app.use(async (ctx, next) => {
  ctx.logger.debug(ctx.url);
  await next();
});
// 初始化路由中间件
app.use(routers.routes()).use(routers.allowedMethods());
app.use(staticRouters.routes()).use(staticRouters.allowedMethods());
app.listen(PORT);

console.log(`server启动成功 端口:${PORT}`);
