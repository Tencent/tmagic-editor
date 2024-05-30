import { reactive } from 'vue';
import { cloneDeep, get } from 'lodash-es';
import { Writable } from 'type-fest';

import type { EventOption } from '@tmagic/core';
import { Target, type TargetOptions, Watcher } from '@tmagic/dep';
import type { FormConfig } from '@tmagic/form';
import type { DataSourceSchema, Id, MNode } from '@tmagic/schema';
import { guid, toLine } from '@tmagic/utils';

import editorService from '@editor/services/editor';
import storageService, { Protocol } from '@editor/services/storage';
import type { DatasourceTypeOption, SyncHookPlugin } from '@editor/type';
import { getFormConfig, getFormValue } from '@editor/utils/data-source';
import { COPY_DS_STORAGE_KEY } from '@editor/utils/editor';

import BaseService from './BaseService';

interface State {
  datasourceTypeList: DatasourceTypeOption[];
  dataSources: DataSourceSchema[];
  editable: boolean;
  configs: Record<string, FormConfig>;
  values: Record<string, Partial<DataSourceSchema>>;
  events: Record<string, EventOption[]>;
  methods: Record<string, EventOption[]>;
}

type StateKey = keyof State;

const canUsePluginMethods = {
  async: [],
  sync: [
    'getFormConfig',
    'setFormConfig',
    'getFormValue',
    'setFormValue',
    'getFormEvent',
    'setFormEvent',
    'getFormMethod',
    'setFormMethod',
    'add',
    'update',
    'remove',
    'createId',
  ] as const,
};

type SyncMethodName = Writable<(typeof canUsePluginMethods)['sync']>;

class DataSource extends BaseService {
  private state = reactive<State>({
    datasourceTypeList: [],
    dataSources: [],
    editable: true,
    configs: {},
    values: {},
    events: {},
    methods: {},
  });

  constructor() {
    super(canUsePluginMethods.sync.map((methodName) => ({ name: methodName, isAsync: false })));
  }

  public set<K extends StateKey, T extends State[K]>(name: K, value: T) {
    this.state[name] = value;
  }

  public get<K extends StateKey>(name: K): State[K] {
    return this.state[name];
  }

  public getFormConfig(type = 'base') {
    return getFormConfig(toLine(type), this.get('configs'));
  }

  public setFormConfig(type: string, config: FormConfig) {
    this.get('configs')[toLine(type)] = config;
  }

  public getFormValue(type = 'base') {
    return getFormValue(toLine(type), this.get('values')[type]);
  }

  public setFormValue(type: string, value: Partial<DataSourceSchema>) {
    this.get('values')[toLine(type)] = value;
  }

  public getFormEvent(type = 'base') {
    return this.get('events')[toLine(type)] || [];
  }

  public setFormEvent(type: string, value: EventOption[] = []) {
    this.get('events')[toLine(type)] = value;
  }

  public getFormMethod(type = 'base') {
    return this.get('methods')[toLine(type)] || [];
  }

  public setFormMethod(type: string, value: EventOption[] = []) {
    this.get('methods')[toLine(type)] = value;
  }

  public add(config: DataSourceSchema) {
    const newConfig = {
      ...config,
      id: config.id && !this.getDataSourceById(config.id) ? config.id : this.createId(),
    };

    this.get('dataSources').push(newConfig);

    this.emit('add', newConfig);

    return newConfig;
  }

  public update(config: DataSourceSchema) {
    const dataSources = this.get('dataSources');

    const index = dataSources.findIndex((ds) => ds.id === config.id);
    dataSources[index] = cloneDeep(config);

    this.emit('update', config);

    return config;
  }

  public remove(id: string) {
    const dataSources = this.get('dataSources');
    const index = dataSources.findIndex((ds) => ds.id === id);
    dataSources.splice(index, 1);

    this.emit('remove', id);
  }

  public createId(): string {
    return `ds_${guid()}`;
  }

  public getDataSourceById(id: string) {
    return this.get('dataSources').find((ds) => ds.id === id);
  }

  public resetState() {
    this.set('dataSources', []);
  }

  public destroy() {
    this.removeAllListeners();
    this.resetState();
    this.removeAllPlugins();
  }

  public usePlugin(options: SyncHookPlugin<SyncMethodName, DataSource>): void {
    super.usePlugin(options);
  }

  /**
   * 复制时会带上组件关联的数据源
   * @param config 组件节点配置
   * @returns
   */
  public copyWithRelated(config: MNode | MNode[], collectorOptions?: TargetOptions): void {
    const copyNodes: MNode[] = Array.isArray(config) ? config : [config];
    const copyData: DataSourceSchema[] = [];

    if (collectorOptions && typeof collectorOptions.isTarget === 'function') {
      const customTarget = new Target({
        ...collectorOptions,
      });

      const coperWatcher = new Watcher();

      coperWatcher.addTarget(customTarget);

      coperWatcher.collect(copyNodes, {}, true, collectorOptions.type);

      Object.keys(customTarget.deps).forEach((nodeId: Id) => {
        const node = editorService.getNodeById(nodeId);
        if (!node) return;
        customTarget!.deps[nodeId].keys.forEach((key) => {
          const [relateDsId] = get(node, key);
          const isExist = copyData.find((dsItem) => dsItem.id === relateDsId);
          if (!isExist) {
            const relateDs = this.getDataSourceById(relateDsId);
            if (relateDs) {
              copyData.push(relateDs);
            }
          }
        });
      });
    }
    storageService.setItem(COPY_DS_STORAGE_KEY, copyData, {
      protocol: Protocol.OBJECT,
    });
  }
  /**
   * 粘贴数据源
   * @returns
   */
  public paste() {
    const dataSource: DataSourceSchema[] = storageService.getItem(COPY_DS_STORAGE_KEY);
    dataSource.forEach((item: DataSourceSchema) => {
      // 不覆盖同样id的数据源
      if (!this.getDataSourceById(item.id)) {
        this.add(item);
      }
    });
  }
}

export type DataSourceService = DataSource;

export default new DataSource();
