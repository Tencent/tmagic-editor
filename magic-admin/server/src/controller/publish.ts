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

// 处理保存发布请求
import Koa from 'koa';

import PublishService from '@src/service/publish';

class PublishController {
  private service: PublishService = new PublishService();

  // 保存活动基础信息
  saveActInfo = async (ctx: Koa.Context) => {
    try {
      // data不是真正的json对象，可能包含组件自定义code代码
      /* eslint-disable-next-line */
      const { actInfo,rootInfo } = eval(`(${ctx.request.body.data})`);
      const res = await this.service.saveActInfo({ actInfo, rootInfo });
      ctx.body = {
        ret: res.ret,
        msg: res.msg,
      };
    } catch (e) {
      ctx.body = {
        ret: -1,
        msg: (e as Error).message,
      };
    }
  };
  // 发布
  publish = async (ctx: Koa.Context) => {
    try {
      // data不是真正的json对象，可能包含组件自定义code代码
      /* eslint-disable-next-line */
      const { actId, publishPages,rootInfo } = eval(`(${ctx.request.body.data})`);
      const operator = ctx.cookies.get('userName');
      const res = await this.service.publish({ actId, publishPages, rootInfo, operator });
      ctx.body = {
        ret: res.ret,
        msg: res.msg,
      };
    } catch (e) {
      ctx.body = {
        ret: -1,
        msg: (e as Error).message,
      };
    }
  };
}
export default new PublishController();
