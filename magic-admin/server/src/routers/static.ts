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

// web静态资源相关路由
import { pathExistsSync } from 'fs-extra';
import Router from 'koa-router';
import send from 'koa-send';

import { StaticPath } from '@src/config/config';

const router = new Router();
const options = { root: '/', gzip: true, maxage: 36000 };
router.get('/', async (ctx) => {
  await send(ctx, `${StaticPath.ASSETS}/index.html`, options);
});

router.get('/static/*', async (ctx) => {
  const file = `${StaticPath.STATIC}/${ctx.params[0]}`;
  if (pathExistsSync(file)) {
    await send(ctx, file, options);
  }
});

router.get('/*', async (ctx) => {
  const file = `${StaticPath.ASSETS}/${ctx.params[0]}`;
  if (pathExistsSync(file)) {
    await send(ctx, file, options);
  } else {
    await send(ctx, `${StaticPath.ASSETS}/index.html`, options);
  }
});

export default router;
