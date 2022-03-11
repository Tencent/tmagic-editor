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

import 'regenerator-runtime/runtime';
import publishController from '@src/controller/publish';
import serialize from 'serialize-javascript';
jest.mock('@src/service/publish', () =>
  jest.fn().mockImplementation(() => ({
    publish: jest.fn((res) => {
      res.ret = 0;
      res.msg = '发布成功';
      return res;
    }),
    saveActInfo: jest.fn((res) => {
      res.ret = 0;
      res.msg = '保存成功';
      return res;
    }),
    'ctx.cookie.get': jest.fn(() => {}),
  })),
);
const serializeConfig = (value): string =>
  serialize(value, {
    space: 2,
    unsafe: true,
  }).replace(/"(\w+)":\s/g, '$1: ');

const mockSaveData = {
  actId: 1,
  type: 'app',
  items: [],
};
const mockPublishData = {
  actId: '123',
  publishPages: ['index'],
  rootInfo: '',
};
const uiConfigStr = serializeConfig(mockSaveData);
const publishDataStr = serializeConfig(mockPublishData);

describe('保存与发布', () => {
  it('保存成功', async () => {
    const ctx = {
      request: {
        body: {
          data: uiConfigStr,
        },
      },
      body: {
        data: [],
        total: 0,
        fetch: false,
        errorMsg: '',
      },
    };
    await publishController.saveActInfo(ctx);
    expect(ctx.body).toEqual({
      ret: 0,
      msg: '保存成功',
    });
  });
  it('保存失败', async () => {
    const ctx = {
      request: {},
      body: {},
    };
    await publishController.saveActInfo(ctx);
    expect(ctx.body).toEqual({
      ret: -1,
      msg: "Cannot read property 'data' of undefined",
    });
  });
  it('发布成功', async () => {
    const ctx = {
      request: {
        body: {
          data: publishDataStr,
        },
      },
      body: {
        data: [],
        total: 0,
        fetch: false,
        errorMsg: '',
      },
      cookies: {
        get(key) {
          if (key === 'user') return 'default';
        },
      },
    };
    await publishController.publish(ctx);
    expect(ctx.body).toEqual({
      ret: 0,
      msg: '发布成功',
    });
  });
  it('发布失败', async () => {
    const ctx = {
      request: {
        body: {
          data: '',
        },
      },
      body: {
        data: [],
        total: 0,
        fetch: false,
        errorMsg: '',
      },
      cookies: {
        get(key) {
          if (key === 'user') return 'default';
        },
      },
    };
    await publishController.publish(ctx);
    expect(ctx.body).toEqual({
      ret: -1,
      msg: "Unexpected token ')'",
    });
  });
});
