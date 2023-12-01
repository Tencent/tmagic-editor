/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
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
import { HttpOptions, RequestFunction } from '@tmagic/schema';
import { getValueByKeyPath } from '@tmagic/utils';

import { DataSourceOptions, HttpDataSourceSchema } from '@data-source/types';

import DataSource from './Base';

/**
 * 将json对象转换为urlencoded字符串
 * @param data json对象
 * @returns string
 */
const urlencoded = (data: Record<string, string | number | boolean | null | undefined>) =>
  Object.entries(data).reduce((prev, [key, value]) => {
    let v = value;
    if (typeof value === 'object') {
      v = JSON.stringify(value);
    }
    if (typeof value !== 'undefined') {
      return `${prev}${prev ? '&' : ''}${globalThis.encodeURIComponent(key)}=${globalThis.encodeURIComponent(`${v}`)}`;
    }
    return prev;
  }, '');

/**
 * 浏览器端请求
 * 如果未有自定义的request方法，则使用浏览器的fetch方法
 * @param options 请求参数
 */
const webRequest = async (options: HttpOptions) => {
  const { url, method = 'GET', headers = {}, params = {}, data = {}, ...config } = options;
  const query = urlencoded(params);
  let body: string = JSON.stringify(data);
  if (headers['Content-Type']?.includes('application/x-www-form-urlencoded')) {
    body = urlencoded(data);
  }

  const response = await globalThis.fetch(query ? `${url}?${query}` : url, {
    method,
    headers,
    body: method === 'GET' ? undefined : body,
    ...config,
  });

  return response.json();
};

/**
 * Http 数据源
 * @description 通过 http 请求获取数据
 */
export default class HttpDataSource extends DataSource<HttpDataSourceSchema> {
  /** 是否正在发起请求 */
  public isLoading = false;
  public error?: {
    msg?: string;
    code?: string | number;
  };
  /** 请求配置 */
  public httpOptions: HttpOptions;

  /** 请求函数 */
  #fetch?: RequestFunction;
  /** 请求前需要执行的函数队列 */
  #beforeRequest: ((...args: any[]) => any)[] = [];
  /** 请求后需要执行的函数队列 */
  #afterRequest: ((...args: any[]) => any)[] = [];

  #type = 'http';

  constructor(options: DataSourceOptions<HttpDataSourceSchema>) {
    const { options: httpOptions } = options.schema;

    super(options);

    this.httpOptions = httpOptions;

    if (typeof options.request === 'function') {
      this.#fetch = options.request;
    } else if (typeof globalThis.fetch === 'function') {
      this.#fetch = webRequest;
    }

    this.methods.forEach((method) => {
      if (typeof method.content !== 'function') return;
      if (method.timing === 'beforeRequest') {
        this.#beforeRequest.push(method.content);
      }
      if (method.timing === 'afterRequest') {
        this.#afterRequest.push(method.content);
      }
    });
  }

  public get type() {
    return this.#type;
  }

  public async init() {
    if (this.schema.autoFetch) {
      await this.request(this.httpOptions);
    }

    super.init();
  }

  public async request(options: Partial<HttpOptions> = {}) {
    this.isLoading = true;

    let reqOptions = {
      ...this.httpOptions,
      ...options,
    };

    try {
      for (const method of this.#beforeRequest) {
        await method({ options: reqOptions, params: {}, dataSource: this, app: this.app });
      }

      if (typeof this.schema.beforeRequest === 'function') {
        reqOptions = this.schema.beforeRequest(reqOptions, { app: this.app, dataSource: this });
      }

      // 注意：在编辑器中mockData不会为空，至少是默认值，不会发起请求
      let res = this.mockData ? this.mockData : await this.#fetch?.(reqOptions);

      for (const method of this.#afterRequest) {
        await method({ res, options: reqOptions, params: {}, dataSource: this, app: this.app });
      }

      if (typeof this.schema.afterResponse === 'function') {
        res = this.schema.afterResponse(res, { app: this.app, dataSource: this, options: reqOptions });
      }

      if (this.schema.responseOptions?.dataPath) {
        const data = getValueByKeyPath(this.schema.responseOptions.dataPath, res);
        this.setData(data);
      } else {
        this.setData(res);
      }

      this.error = undefined;
    } catch (error: any) {
      this.error = {
        msg: error.message,
      };

      this.emit('error', error);
    }

    this.isLoading = false;
  }

  public get(options: Partial<HttpOptions> & { url: string }) {
    return this.request({
      ...options,
      method: 'GET',
    });
  }

  public post(options: Partial<HttpOptions> & { url: string }) {
    return this.request({
      ...options,
      method: 'POST',
    });
  }
}
