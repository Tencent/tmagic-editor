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

import type { DataSchema } from '@tmagic/schema';

import type { DataSourceOptions } from '@data-source/types';
import { getDefaultValueFromFields } from '@data-source/util';

/**
 * 静态数据源
 */
export default class DataSource extends EventEmitter {
  public type = 'base';

  public id: string;

  public isInit = false;

  public data: Record<string, any> = {};

  private fields: DataSchema[] = [];

  constructor(options: DataSourceOptions) {
    super();

    this.id = options.schema.id;
    this.setFields(options.schema.fields);

    this.updateDefaultData();
  }

  public setFields(fields: DataSchema[]) {
    this.fields = fields;
  }

  public setData(data: Record<string, any>) {
    // todo: 校验数据，看是否符合 schema
    this.data = data;
    this.emit('change');
  }

  public getDefaultData() {
    return getDefaultValueFromFields(this.fields);
  }

  public updateDefaultData() {
    this.setData(this.getDefaultData());
  }

  public async init() {
    this.isInit = true;
  }

  public destroy() {
    this.data = {};
    this.fields = [];
    this.removeAllListeners();
  }
}
