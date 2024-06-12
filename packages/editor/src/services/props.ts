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
import { Writable } from 'type-fest';

import { Target, type TargetOptions, Watcher } from '@tmagic/dep';
import type { FormConfig } from '@tmagic/form';
import type { Id, MComponent, MNode } from '@tmagic/schema';
import { getNodePath, getValueByKeyPath, guid, setValueByKeyPath, toLine } from '@tmagic/utils';

import editorService from '@editor/services/editor';
import type {
  AsyncHookPlugin,
  PropsFormConfigFunction,
  PropsFormValueFunction,
  PropsState,
  SyncHookPlugin,
} from '@editor/type';
import { fillConfig } from '@editor/utils/props';

import BaseService from './BaseService';

const canUsePluginMethods = {
  async: [
    'setPropsConfig',
    'getPropsConfig',
    'setPropsValue',
    'getPropsValue',
    'fillConfig',
    'getDefaultPropsValue',
  ] as const,
  sync: ['createId', 'setNewItemId'] as const,
};

type AsyncMethodName = Writable<(typeof canUsePluginMethods)['async']>;
type SyncMethodName = Writable<(typeof canUsePluginMethods)['sync']>;

class Props extends BaseService {
  private state = reactive<PropsState>({
    propsConfigMap: {},
    propsValueMap: {},
    relateIdMap: {},
  });

  constructor() {
    super([
      ...canUsePluginMethods.async.map((methodName) => ({ name: methodName, isAsync: true })),
      ...canUsePluginMethods.sync.map((methodName) => ({ name: methodName, isAsync: false })),
    ]);
  }

  public setPropsConfigs(configs: Record<string, FormConfig | PropsFormConfigFunction>) {
    Object.keys(configs).forEach((type: string) => {
      this.setPropsConfig(toLine(type), configs[type]);
    });
    this.emit('props-configs-change');
  }

  public async fillConfig(config: FormConfig, labelWidth?: string) {
    return fillConfig(config, typeof labelWidth !== 'function' ? labelWidth : '80px');
  }

  public async setPropsConfig(type: string, config: FormConfig | PropsFormConfigFunction) {
    let c = config;
    if (typeof config === 'function') {
      c = config({ editorService });
    }

    this.state.propsConfigMap[toLine(type)] = await this.fillConfig(Array.isArray(c) ? c : [c]);
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

    return cloneDeep(this.state.propsConfigMap[toLine(type)] || (await this.fillConfig([])));
  }

  public setPropsValues(values: Record<string, Partial<MNode> | PropsFormValueFunction>) {
    Object.keys(values).forEach((type: string) => {
      this.setPropsValue(toLine(type), values[type]);
    });
  }

  /**
   * 为指点类型组件设置组件初始值
   * @param type 组件类型
   * @param value 组件初始值
   */
  public async setPropsValue(type: string, value: Partial<MNode> | PropsFormValueFunction) {
    let v = value;
    if (typeof value === 'function') {
      v = value({ editorService });
    }
    this.state.propsValueMap[toLine(type)] = v;
  }

  /**
   * 获取指定类型的组件初始值
   * @param type 组件类型
   * @returns 组件初始值
   */
  public async getPropsValue(componentType: string, { inputEvent, ...defaultValue }: Record<string, any> = {}) {
    const type = toLine(componentType);

    if (type === 'area') {
      const value = (await this.getPropsValue('button')) as MComponent;
      value.className = 'action-area';
      value.text = '';
      if (value.style) {
        value.style.backgroundColor = 'rgba(255, 255, 255, 0)';
      }
      return value;
    }

    const id = this.createId(type);
    const defaultPropsValue = this.getDefaultPropsValue(type);
    const data = this.setNewItemId(
      cloneDeep({
        type,
        ...defaultValue,
      } as any),
    );

    return {
      id,
      ...defaultPropsValue,
      ...mergeWith({}, cloneDeep(this.state.propsValueMap[type] || {}), data),
    };
  }

  public createId(type: string | number): string {
    return `${type}_${guid()}`;
  }

  /**
   * 将组件与组件的子元素配置中的id都设置成一个新的ID
   * 如果没有相同ID并且force为false则保持不变
   * @param {Object} config 组件配置
   * @param {Boolean} force 是否强制设置新的ID
   */
  /* eslint no-param-reassign: ["error", { "props": false }] */
  public setNewItemId(config: MNode, force = true) {
    if (force || editorService.getNodeById(config.id)) {
      const newId = this.createId(config.type || 'component');
      this.setRelateId(config.id, newId);
      config.id = newId;
    }

    if (config.items && Array.isArray(config.items)) {
      for (const item of config.items) {
        this.setNewItemId(item);
      }
    }

    return config;
  }

  /**
   * 获取默认属性配置
   * @param type 组件类型
   * @returns Object
   */
  public getDefaultPropsValue(type: string) {
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

  /**
   * 替换关联ID
   * @param originConfigs 原组件配置
   * @param targetConfigs 待替换的组件配置
   */
  public replaceRelateId(originConfigs: MNode[], targetConfigs: MNode[], collectorOptions: TargetOptions) {
    const relateIdMap = this.getRelateIdMap();

    if (Object.keys(relateIdMap).length === 0) return;

    const target = new Target({
      ...collectorOptions,
    });

    const coperWatcher = new Watcher();

    coperWatcher.addTarget(target);
    coperWatcher.collect(originConfigs, {}, true, collectorOptions.type);

    originConfigs.forEach((config: MNode) => {
      const newId = relateIdMap[config.id];
      const path = getNodePath(newId, targetConfigs);
      const targetConfig = path[path.length - 1];

      if (!targetConfig) return;

      target.deps[config.id]?.keys?.forEach((fullKey) => {
        const relateOriginId = getValueByKeyPath(fullKey, config);
        const relateTargetId = relateIdMap[relateOriginId];
        if (!relateTargetId) return;
        setValueByKeyPath(fullKey, relateTargetId, targetConfig);
      });

      // 递归items
      if (config.items && Array.isArray(config.items)) {
        this.replaceRelateId(config.items, targetConfigs, collectorOptions);
      }
    });
  }

  /**
   * 清除setNewItemId前后映射关系
   */
  public clearRelateId() {
    this.state.relateIdMap = {};
  }

  public destroy() {
    this.resetState();
    this.removeAllListeners();
    this.removeAllPlugins();
  }

  public usePlugin(options: AsyncHookPlugin<AsyncMethodName, Props> & SyncHookPlugin<SyncMethodName, Props>): void {
    super.usePlugin(options);
  }

  /**
   * 获取setNewItemId前后映射关系
   * @param oldId 原组件ID
   * @returns 新旧ID映射
   */
  private getRelateIdMap() {
    return this.state.relateIdMap;
  }

  /**
   * 记录setNewItemId前后映射关系
   * @param oldId 原组件ID
   * @param newId 分配的新ID
   */
  private setRelateId(oldId: Id, newId: Id) {
    this.state.relateIdMap[oldId] = newId;
  }
}

export type PropsService = Props;

export default new Props();
