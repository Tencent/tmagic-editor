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

import { cloneDeep } from 'lodash-es';

import type { AppCore, CodeBlockContent, DataSchema, DataSourceSchema } from '@tmagic/schema';
import { getDefaultValueFromFields } from '@tmagic/utils';

import { ObservedData } from '@data-source/observed-data/ObservedData';
import { SimpleObservedData } from '@data-source/observed-data/SimpleObservedData';
import type { ChangeEvent, DataSourceOptions } from '@data-source/types';

/**
 * 静态数据源
 */
export default class DataSource<T extends DataSourceSchema = DataSourceSchema> extends EventEmitter {
  public isInit = false;

  /** @tmagic/core 实例 */
  public app: AppCore;

  protected mockData?: Record<string | number, any>;

  #type = 'base';
  #id: string;
  #schema: T;
  #observedData: ObservedData;

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

    let data = options.initialData;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const ObservedDataClass = options.ObservedDataClass || SimpleObservedData;
    if (this.app.platform === 'editor') {
      // 编辑器中有mock使用mock，没有使用默认值
      this.mockData = options.schema.mocks?.find((mock) => mock.useInEditor)?.data || this.getDefaultData();
      data = cloneDeep(this.mockData);
    } else if (typeof options.useMock === 'boolean' && options.useMock) {
      // 设置了使用mock就使用mock数据
      this.mockData = options.schema.mocks?.find((mock) => mock.enable)?.data || this.getDefaultData();
      data = this.mockData;
    } else if (!options.initialData) {
      data = this.getDefaultData();
    } else {
      // 在ssr模式下，会将server端获取的数据设置到initialData
      this.#observedData = new ObservedDataClass(options.initialData ?? {});
      // 设置isInit,防止manager中执行init方法
      this.isInit = true;
      return;
    }
    this.#observedData = new ObservedDataClass(data ?? {});
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

  public get data() {
    return this.#observedData.getData('');
  }

  public setData(data: any, path?: string) {
    this.#observedData.update(data, path);

    const changeEvent: ChangeEvent = {
      updateData: data,
      path,
    };

    this.emit('change', changeEvent);
  }

  public setValue(path: string, data: any) {
    return this.setData(data, path);
  }

  public onDataChange(path: string, callback: (newVal: any) => void) {
    this.#observedData.on(path, callback);
  }

  public offDataChange(path: string, callback: (newVal: any) => void) {
    this.#observedData.off(path, callback);
  }

  public getDefaultData() {
    return getDefaultValueFromFields(this.#fields);
  }

  public async init() {
    this.isInit = true;
  }

  public destroy() {
    this.#fields = [];
    this.removeAllListeners();
    this.#observedData.destroy();
  }
}
