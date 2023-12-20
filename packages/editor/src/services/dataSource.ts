import { reactive } from 'vue';
import { cloneDeep } from 'lodash-es';

import type { EventOption } from '@tmagic/core';
import type { FormConfig } from '@tmagic/form';
import type { DataSourceSchema } from '@tmagic/schema';
import { guid } from '@tmagic/utils';

import type { DatasourceTypeOption } from '@editor/type';
import { getFormConfig, getFormValue } from '@editor/utils/data-source';

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
    super([
      { name: 'getFormConfig', isAsync: false },
      { name: 'setFormConfig', isAsync: false },
      { name: 'getFormValue', isAsync: false },
      { name: 'setFormValue', isAsync: false },
      { name: 'getFormEvent', isAsync: false },
      { name: 'setFormEvent', isAsync: false },
      { name: 'getFormMethod', isAsync: false },
      { name: 'setFormMethod', isAsync: false },
      { name: 'add', isAsync: false },
      { name: 'update', isAsync: false },
      { name: 'remove', isAsync: false },
      { name: 'createId', isAsync: false },
    ]);
  }

  public set<K extends StateKey, T extends State[K]>(name: K, value: T) {
    this.state[name] = value;
  }

  public get<K extends StateKey>(name: K): State[K] {
    return this.state[name];
  }

  public getFormConfig(type = 'base') {
    return getFormConfig(type, this.get('configs'));
  }

  public setFormConfig(type: string, config: FormConfig) {
    this.get('configs')[type] = config;
  }

  public getFormValue(type = 'base') {
    return getFormValue(type, this.get('values')[type]);
  }

  public setFormValue(type: string, value: Partial<DataSourceSchema>) {
    this.get('values')[type] = value;
  }

  public getFormEvent(type = 'base') {
    return this.get('events')[type] || [];
  }

  public setFormEvent(type: string, value: EventOption[] = []) {
    this.get('events')[type] = value;
  }

  public getFormMethod(type = 'base') {
    return this.get('methods')[type] || [];
  }

  public setFormMethod(type: string, value: EventOption[] = []) {
    this.get('methods')[type] = value;
  }

  public add(config: DataSourceSchema) {
    const newConfig = {
      ...config,
      id: this.createId(),
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

  private createId(): string {
    return `ds_${guid()}`;
  }
}

export type DataSourceService = DataSource;

export default new DataSource();
