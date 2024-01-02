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
import EventEmitter from 'events';

import type { AppCore, CodeBlockContent, DataSchema, DataSourceSchema } from '@tmagic/schema';
import { getDefaultValueFromFields, setValueByKeyPath } from '@tmagic/utils';

import type { ChangeEvent, DataSourceOptions } from '@data-source/types';

/**
 * 静态数据源
 */
export default class DataSource<T extends DataSourceSchema = DataSourceSchema> extends EventEmitter {
  public isInit = false;

  public data: Record<string, any> = {};

  /** @tmagic/core 实例 */
  public app: AppCore;

  protected mockData?: Record<string | number, any>;

  #type = 'base';
  #id: string;
  #schema: T;

  /** 数据源自定义字段配置 */
  #fields: DataSchema[] = [];
  /** 数据源自定义方法配置 */
  #methods: CodeBlockContent[] = [];

  constructor(options: DataSourceOptions<T>) {
    super();

    this.#id = options.schema.id;
    this.#schema = options.schema;

    this.app = options.app;

    this.setFields(options.schema.fields);
    this.setMethods(options.schema.methods || []);

    if (this.app.platform === 'editor') {
      // 编辑器中有mock使用mock，没有使用默认值
      this.mockData = options.schema.mocks?.find((mock) => mock.useInEditor)?.data || this.getDefaultData();
      this.setData(this.mockData);
    } else if (typeof options.useMock === 'boolean' && options.useMock) {
      // 设置了使用mock就使用mock数据
      this.mockData = options.schema.mocks?.find((mock) => mock.enable)?.data || this.getDefaultData();
      this.setData(this.mockData);
    } else if (!options.initialData) {
      this.setData(this.getDefaultData());
    } else {
      // 在ssr模式下，会将server端获取的数据设置到initialData
      this.setData(options.initialData);
      // 设置isInit,防止manager中执行init方法
      this.isInit = true;
    }
  }

  public get id() {
    return this.#id;
  }

  public get type() {
    return this.#type;
  }

  public get schema() {
    return this.#schema;
  }

  public get fields() {
    return this.#fields;
  }

  public get methods() {
    return this.#methods;
  }

  public setFields(fields: DataSchema[]) {
    this.#fields = fields;
  }

  public setMethods(methods: CodeBlockContent[]) {
    this.#methods = methods;
  }

  public setData(data: any, path?: string) {
    if (path) {
      setValueByKeyPath(path, data, this.data);
    } else {
      // todo: 校验数据，看是否符合 schema
      this.data = data;
    }

    const changeEvent: ChangeEvent = {
      updateData: data,
      path,
    };

    this.emit('change', changeEvent);
  }

  public getDefaultData() {
    return getDefaultValueFromFields(this.#fields);
  }

  public async init() {
    this.isInit = true;
  }

  public destroy() {
    this.data = {};
    this.#fields = [];
    this.removeAllListeners();
  }
}
