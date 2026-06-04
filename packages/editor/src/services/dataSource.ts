import { reactive } from 'vue';
import { cloneDeep, get } from 'lodash-es';
import type { Writable } from 'type-fest';

import type { DataSourceSchema, EventOption, Id, MNode, TargetOptions } from '@tmagic/core';
import { Target, Watcher } from '@tmagic/core';
import type { FormConfig } from '@tmagic/form';
import { getValueByKeyPath, guid, setValueByKeyPath, toLine } from '@tmagic/utils';

import editorService from '@editor/services/editor';
import historyService from '@editor/services/history';
import storageService, { Protocol } from '@editor/services/storage';
import type {
  DataSourceStepValue,
  DatasourceTypeOption,
  HistoryOpOptions,
  HistoryOpOptionsWithChangeRecords,
  SyncHookPlugin,
} from '@editor/type';
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

/**
 * 「回滚」生成的新 step 简短描述。
 * 仅在 service 层使用，避免依赖 UI 层 composables。
 */
const describeRevertDataSourceStep = (step: DataSourceStepValue): string => {
  const { oldSchema, newSchema, changeRecords, id } = step;
  if (oldSchema === null && newSchema) return `撤回新增 ${newSchema.title || newSchema.id || id}`;
  if (oldSchema && newSchema === null) return `还原已删除的 ${oldSchema.title || oldSchema.id || id}`;
  const title = newSchema?.title || oldSchema?.title || `${id}`;
  const propPath = changeRecords?.[0]?.propPath;
  return propPath ? `还原 ${title} · ${propPath}` : `还原 ${title}`;
};

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

  /**
   * 新增数据源
   * @param config 数据源配置
   * @param options 可选配置
   * @param options.doNotPushHistory 是否不写入历史记录（默认 false）
   * @param options.historyDescription 入栈时附带的人类可读描述，用于历史面板展示
   */
  public add(
    config: DataSourceSchema,
    { doNotPushHistory = false, historyDescription, historySource }: HistoryOpOptions = {},
  ) {
    const newConfig = {
      ...config,
      id: config.id && !this.getDataSourceById(config.id) ? config.id : this.createId(),
    };

    this.get('dataSources').push(newConfig);

    if (!doNotPushHistory) {
      historyService.pushDataSource(newConfig.id, {
        oldSchema: null,
        newSchema: newConfig,
        historyDescription,
        source: historySource,
      });
    }

    this.emit('add', newConfig);

    return newConfig;
  }

  /**
   * 更新数据源
   * @param config 数据源配置
   * @param data 额外数据
   * @param data.changeRecords form 端变更记录
   * @param data.doNotPushHistory 是否不写入历史记录（默认 false）
   * @param data.historyDescription 入栈时附带的人类可读描述，用于历史面板展示
   */
  public update(
    config: DataSourceSchema,
    {
      changeRecords = [],
      doNotPushHistory = false,
      historyDescription,
      historySource,
    }: HistoryOpOptionsWithChangeRecords = {},
  ) {
    const dataSources = this.get('dataSources');

    const index = dataSources.findIndex((ds) => ds.id === config.id);

    const oldConfig = dataSources[index];
    const newConfig = cloneDeep(config);

    dataSources[index] = newConfig;

    if (!doNotPushHistory) {
      historyService.pushDataSource(newConfig.id, {
        oldSchema: oldConfig ? cloneDeep(oldConfig) : null,
        newSchema: newConfig,
        changeRecords,
        historyDescription,
        source: historySource,
      });
    }

    this.emit('update', newConfig, {
      oldConfig,
      changeRecords,
    });

    return newConfig;
  }

  /**
   * 删除数据源
   * @param id 数据源 id
   * @param options 可选配置
   * @param options.doNotPushHistory 是否不写入历史记录（默认 false）
   * @param options.historyDescription 入栈时附带的人类可读描述，用于历史面板展示
   */
  public remove(id: string, { doNotPushHistory = false, historyDescription, historySource }: HistoryOpOptions = {}) {
    const dataSources = this.get('dataSources');
    const index = dataSources.findIndex((ds) => ds.id === id);
    const oldConfig = index !== -1 ? dataSources[index] : null;
    dataSources.splice(index, 1);

    if (oldConfig && !doNotPushHistory) {
      historyService.pushDataSource(id, {
        oldSchema: cloneDeep(oldConfig),
        newSchema: null,
        historyDescription,
        source: historySource,
      });
    }

    this.emit('remove', id);
  }

  /**
   * 撤销指定数据源的最近一次变更。
   *
   * 内部走 add / update / remove，因此会自动触发 dataSourceService 的事件，
   * 由 initService 中的对应 handler 重新收集 dep（DATA_SOURCE / DATA_SOURCE_COND / DATA_SOURCE_METHOD）。
   * 所有写回都带 `doNotPushHistory: true`，避免在历史栈里产生新的记录。
   *
   * @param id 数据源 id
   * @returns 撤销的 step；栈不存在或已无可撤销时返回 null
   */
  public undo(id: Id) {
    const step = historyService.undoDataSource(id);
    if (!step) return null;
    this.applyHistoryStep(step, true);
    return step;
  }

  /**
   * 重做指定数据源的下一次变更。
   * @param id 数据源 id
   * @returns 重做的 step；栈不存在或已无可重做时返回 null
   */
  public redo(id: Id) {
    const step = historyService.redoDataSource(id);
    if (!step) return null;
    this.applyHistoryStep(step, false);
    return step;
  }

  /** 是否可对指定数据源撤销。 */
  public canUndo(id: Id): boolean {
    return historyService.canUndoDataSource(id);
  }

  /** 是否可对指定数据源重做。 */
  public canRedo(id: Id): boolean {
    return historyService.canRedoDataSource(id);
  }

  /**
   * 跳转指定数据源的历史栈到目标游标。语义同 editor.gotoPageStep。
   *
   * @param id          数据源 id
   * @param targetCursor 目标游标位置（已应用步骤数量）
   * @returns 实际移动到的最终游标位置
   */
  public goto(id: Id, targetCursor: number): number {
    let cursor = historyService.getDataSourceCursor(id);
    const target = Math.max(0, targetCursor);
    while (cursor > target) {
      if (!this.undo(id)) break;
      cursor -= 1;
    }
    while (cursor < target) {
      if (!this.redo(id)) break;
      cursor += 1;
    }
    return cursor;
  }

  /**
   * 「回滚」指定数据源历史步骤（类 git revert 语义）：
   * - 不动原始栈结构（不移动 cursor、不丢弃任何步骤）；
   * - 把目标 step 的修改**反向应用**一次，并作为**新步骤**追加到栈顶；
   * - 仅对已应用的步骤生效——未应用步骤本身就不存在于当前 schema 中，反向无意义。
   *
   * @param id    数据源 id
   * @param index 目标 step 在该栈中的索引（0 为最早），通常由历史面板传入
   * @returns 反向后产生的新 step；目标不存在 / 未应用时返回 null
   */
  public revert(id: Id, index: number): DataSourceStepValue | null {
    const list = historyService.getDataSourceStepList(id);
    const entry = list[index];
    if (!entry?.applied) return null;
    // 更新类步骤（前后 schema 都存在）必须带 changeRecords 才支持回滚，否则只能整 schema 替换，会冲掉后续无关变更。
    if (entry.step.oldSchema && entry.step.newSchema && !entry.step.changeRecords?.length) return null;
    const description = `回滚 #${index + 1}: ${describeRevertDataSourceStep(entry.step)}`;
    return this.applyRevertStep(entry.step, description);
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

  /**
   * 反向应用一个 step 并以新 step 入栈（不带 doNotPushHistory）。逻辑与 applyHistoryStep(reverse=true)
   * 同构，差异仅在于走对应的公共 add / update / remove 而不是带 doNotPushHistory 的版本。
   */
  private applyRevertStep(step: DataSourceStepValue, historyDescription: string): DataSourceStepValue | null {
    const { id, oldSchema, newSchema, changeRecords } = step;

    // 原本是新增 → revert 即删除
    if (oldSchema === null && newSchema) {
      this.remove(`${id}`, { historyDescription, historySource: 'rollback' });
      return historyService.getDataSourceStepList(id).slice(-1)[0]?.step ?? null;
    }

    // 原本是删除 → revert 即重新加回
    if (oldSchema && newSchema === null) {
      this.add(cloneDeep(oldSchema), { historyDescription, historySource: 'rollback' });
      return historyService.getDataSourceStepList(id).slice(-1)[0]?.step ?? null;
    }

    if (!oldSchema || !newSchema) return null;

    // 原本是更新 → 把 oldSchema 写回；优先按 changeRecords 局部 patch
    if (changeRecords?.length) {
      const current = this.getDataSourceById(`${id}`);
      if (!current) return null;
      const patched = cloneDeep(current) as DataSourceSchema;
      let fallbackToFullReplace = false;
      for (const record of changeRecords) {
        if (!record.propPath) {
          fallbackToFullReplace = true;
          break;
        }
        const value = cloneDeep(getValueByKeyPath(record.propPath, oldSchema));
        setValueByKeyPath(record.propPath, value, patched);
      }
      this.update(fallbackToFullReplace ? cloneDeep(oldSchema) : patched, {
        changeRecords,
        historyDescription,
        historySource: 'rollback',
      });
      return historyService.getDataSourceStepList(id).slice(-1)[0]?.step ?? null;
    }

    this.update(cloneDeep(oldSchema), { historyDescription, historySource: 'rollback' });
    return historyService.getDataSourceStepList(id).slice(-1)[0]?.step ?? null;
  }

  /**
   * 把一条历史 step 应用到当前数据源服务上。
   *
   * 复用现有的 add / update / remove，目的是借助它们发出的事件触发 initService 中
   * 的依赖收集逻辑（DATA_SOURCE / DATA_SOURCE_COND / DATA_SOURCE_METHOD）。
   * 所有写回都带 `doNotPushHistory: true`，确保不会在历史栈里产生新的记录。
   *
   * - oldSchema=null, newSchema≠null：原始为新增 → undo 删除；redo 再次 add
   * - oldSchema≠null, newSchema=null：原始为删除 → undo 还原 add；redo 再次删除
   * - 两侧都有：原始为更新 → 按 changeRecords 局部 patch；缺省退化为整 schema 替换
   *
   * @param step 历史 step
   * @param reverse true=撤销，false=重做
   */
  private applyHistoryStep(step: DataSourceStepValue, reverse: boolean): void {
    const { id, oldSchema, newSchema, changeRecords } = step;

    // 新增 / 删除：直接 add 或 remove，不走 patch 逻辑
    if (oldSchema === null && newSchema) {
      if (reverse) {
        this.remove(`${id}`, { doNotPushHistory: true });
      } else {
        this.add(cloneDeep(newSchema), { doNotPushHistory: true });
      }
      return;
    }

    if (oldSchema && newSchema === null) {
      if (reverse) {
        this.add(cloneDeep(oldSchema), { doNotPushHistory: true });
      } else {
        this.remove(`${id}`, { doNotPushHistory: true });
      }
      return;
    }

    if (!oldSchema || !newSchema) return;

    // 更新场景：优先按 changeRecords 局部 patch；缺省退化为整 schema 替换
    const sourceForValues = reverse ? oldSchema : newSchema;

    if (changeRecords?.length) {
      const current = this.getDataSourceById(`${id}`);
      if (!current) return;
      const patched = cloneDeep(current) as DataSourceSchema;
      let fallbackToFullReplace = false;
      for (const record of changeRecords) {
        if (!record.propPath) {
          fallbackToFullReplace = true;
          break;
        }
        const value = cloneDeep(getValueByKeyPath(record.propPath, sourceForValues));
        setValueByKeyPath(record.propPath, value, patched);
      }
      this.update(fallbackToFullReplace ? cloneDeep(sourceForValues) : patched, {
        changeRecords,
        doNotPushHistory: true,
      });
      return;
    }

    this.update(cloneDeep(sourceForValues), { doNotPushHistory: true });
  }
}

export type DataSourceService = DataSource;

export default new DataSource();
