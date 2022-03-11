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

// 处理编辑器请求
import Koa from 'koa';

import EditorService from '@src/service/editor';

class EditorController {
  private service: EditorService = new EditorService();

  // 拉取编辑器左侧展示的组件列表
  getComponentList = async (ctx: Koa.Context) => {
    ctx.body = {
      ret: 0,
      msg: '获取组件列表成功',
      data: await this.service.getComponentList(),
    };
  };
  // 拉取编辑器右边活动配置的web插件
  getWebPlugins = async (ctx: Koa.Context) => {
    ctx.body = await this.service.getWebPlugins();
  };
}

export default new EditorController();
