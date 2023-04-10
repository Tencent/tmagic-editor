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

import { reactive } from 'vue';
import { cloneDeep, mergeWith } from 'lodash-es';

import type { FormConfig } from '@tmagic/form';
import type { MComponent, MNode } from '@tmagic/schema';
import { toLine } from '@tmagic/utils';

import type { PropsState } from '@editor/type';
import { fillConfig } from '@editor/utils/props';

import BaseService from './BaseService';

class Props extends BaseService {
  private state = reactive<PropsState>({
    propsConfigMap: {},
    propsValueMap: {},
  });

  constructor() {
    super([
      'setPropsConfig',
      'getPropsConfig',
      'setPropsValue',
      'getPropsValue',
      'createId',
      'setNewItemId',
      'fillConfig',
      'getDefaultPropsValue',
    ]);
  }

  public setPropsConfigs(configs: Record<string, FormConfig>) {
    Object.keys(configs).forEach((type: string) => {
      this.setPropsConfig(toLine(type), configs[type]);
    });
    this.emit('props-configs-change');
  }

  public async fillConfig(config: FormConfig) {
    return fillConfig(config);
  }

  /**
   * 为指定类型组件设置组件属性表单配置
   * @param type 组件类型
   * @param config 组件属性表单配置
   */
  public async setPropsConfig(type: string, config: FormConfig) {
    this.state.propsConfigMap[type] = await this.fillConfig(Array.isArray(config) ? config : [config]);
  }

  /**
   * 获取指点类型的组件属性表单配置
   * @param type 组件类型
   * @returns 组件属性表单配置
   */
  public async getPropsConfig(type: string): Promise<FormConfig> {
    if (type === 'area') {
      return await this.getPropsConfig('button');
    }

    return cloneDeep(this.state.propsConfigMap[type] || (await this.fillConfig([])));
  }

  public setPropsValues(values: Record<string, MNode>) {
    Object.keys(values).forEach((type: string) => {
      this.setPropsValue(toLine(type), values[type]);
    });
  }

  /**
   * 为指点类型组件设置组件初始值
   * @param type 组件类型
   * @param value 组件初始值
   */
  public async setPropsValue(type: string, value: MNode) {
    this.state.propsValueMap[type] = value;
  }

  /**
   * 获取指定类型的组件初始值
   * @param type 组件类型
   * @returns 组件初始值
   */
  public async getPropsValue(type: string, { inputEvent, ...defaultValue }: Record<string, any> = {}) {
    if (type === 'area') {
      const value = (await this.getPropsValue('button')) as MComponent;
      value.className = 'action-area';
      value.text = '';
      if (value.style) {
        value.style.backgroundColor = 'rgba(255, 255, 255, 0)';
      }
      return value;
    }

    const [id, defaultPropsValue, data] = await Promise.all([
      this.createId(type),
      this.getDefaultPropsValue(type),
      this.setNewItemId(
        cloneDeep({
          type,
          ...defaultValue,
        } as any),
      ),
    ]);

    return {
      id,
      ...defaultPropsValue,
      ...mergeWith({}, cloneDeep(this.state.propsValueMap[type] || {}), data),
    };
  }

  public async createId(type: string | number): Promise<string> {
    return `${type}_${this.guid()}`;
  }

  /**
   * 将组件与组件的子元素配置中的id都设置成一个新的ID
   * @param {Object} config 组件配置
   */
  /* eslint no-param-reassign: ["error", { "props": false }] */
  public async setNewItemId(config: MNode) {
    config.id = await this.createId(config.type || 'component');

    if (config.items && Array.isArray(config.items)) {
      for (const item of config.items) {
        await this.setNewItemId(item);
      }
    }

    return config;
  }

  /**
   * 获取默认属性配置
   * @param type 组件类型
   * @returns Object
   */
  public async getDefaultPropsValue(type: string) {
    return ['page', 'container'].includes(type)
      ? {
          type,
          layout: 'absolute',
          style: {},
          name: type,
          items: [],
        }
      : {
          type,
          style: {},
          name: type,
        };
  }

  public resetState() {
    this.state.propsConfigMap = {};
    this.state.propsValueMap = {};
  }

  public destroy() {
    this.resetState();
    this.removeAllListeners();
    this.removeAllPlugins();
  }

  /**
   * 生成指定位数的GUID，无【-】格式
   * @param digit 位数，默认值8
   * @returns
   */
  private guid(digit = 8): string {
    return 'x'.repeat(digit).replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export type PropsService = Props;

export default new Props();
