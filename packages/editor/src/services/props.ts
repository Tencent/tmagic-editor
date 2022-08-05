/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
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

import { reactive } from 'vue';
import { cloneDeep, mergeWith } from 'lodash-es';

import type { FormConfig } from '@tmagic/form';
import type { Id, MComponent, MNode, MPage } from '@tmagic/schema';
import { NodeType } from '@tmagic/schema';
import { isPop, toLine } from '@tmagic/utils';

import type { PropsState } from '../type';
import { DEFAULT_CONFIG, fillConfig } from '../utils/props';

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
      'getDefaultPropsValue',
    ]);
  }

  public setPropsConfigs(configs: Record<string, FormConfig>) {
    Object.keys(configs).forEach((type: string) => {
      this.setPropsConfig(toLine(type), configs[type]);
    });
    this.emit('props-configs-change');
  }

  /**
   * 为指定类型组件设置组件属性表单配置
   * @param type 组件类型
   * @param config 组件属性表单配置
   */
  public setPropsConfig(type: string, config: FormConfig) {
    this.state.propsConfigMap[type] = fillConfig(Array.isArray(config) ? config : [config]);
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

    return cloneDeep(this.state.propsConfigMap[type] || DEFAULT_CONFIG);
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
  public setPropsValue(type: string, value: MNode) {
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

  /**
   * 生成指定位数的GUID，无【-】格式
   * @param digit 位数，默认值8
   * @returns
   */
  guid(digit = 8): string {
    return 'x'.repeat(digit).replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  public async createId(type: string | number): Promise<string> {
    return `${type}_${this.guid()}`;
  }

  /**
   * 将组件与组件的子元素配置中的id都设置成一个新的ID
   * @param {Object} config 组件配置
   */
  /* eslint no-param-reassign: ["error", { "props": false }] */
  public async setNewItemId(config: MNode, parent?: MPage) {
    const oldId = config.id;

    config.id = await this.createId(config.type || 'component');

    // 只有弹窗在页面下的一级子元素才有效
    if (isPop(config) && parent?.type === NodeType.PAGE) {
      updatePopId(oldId, config.id, parent);
    }

    if (config.items && Array.isArray(config.items)) {
      for (const item of config.items) {
        await this.setNewItemId(item, config as MPage);
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
}

/**
 * 复制页面时，需要把组件下关联的弹窗id换测复制出来的弹窗的id
 * @param {number} oldId 复制的源弹窗id
 * @param {number} popId 新的弹窗id
 * @param {Object} pageConfig 页面配置
 */
const updatePopId = (oldId: Id, popId: Id, pageConfig: MPage) => {
  pageConfig.items?.forEach((config) => {
    if (config.pop === oldId) {
      config.pop = popId;
      return;
    }

    if (config.popId === oldId) {
      config.popId = popId;
      return;
    }

    if (Array.isArray(config.items)) {
      updatePopId(oldId, popId, config as MPage);
    }
  });
};

export type PropsService = Props;

export default new Props();
