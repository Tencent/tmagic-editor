import { cloneDeep } from 'lodash-es';

import { compiledNodeField } from '@tmagic/data-source';
import type { DisplayCondItem, EventConfig, Id } from '@tmagic/schema';
import { NODE_CONDS_KEY } from '@tmagic/schema';
import { isValueIncludeDataSource, setValueByKeyPath } from '@tmagic/utils';

import TMagicApp from './App';

export default class DevToolApi {
  app: TMagicApp;

  constructor({ app }: { app: TMagicApp }) {
    this.app = app;
  }

  public openPop(popId: Id) {
    if (typeof this.app.openPop === 'function') {
      return this.app.openPop(popId);
    }
  }

  public setDataSourceData(dsId: string, data: any, path?: string) {
    const ds = this.app.dataSourceManager?.get(dsId);

    if (!ds) {
      return;
    }

    ds.setData(data, path);
  }

  public delDataSourceData() {
    return;
  }

  public requestDataSource(dsId: string) {
    const ds = this.app.dataSourceManager?.get(dsId);

    if (!ds) {
      return;
    }

    if (typeof ds.refresh === 'function') {
      return ds.refresh();
    }

    if (typeof ds.request === 'function') {
      return ds.request();
    }

    ds.isInit = false;
    this.app.dataSourceManager?.init(ds);
  }

  public getDisplayCondRealValue(_nodeId: Id, condItem: DisplayCondItem) {
    return this.app.dataSourceManager?.compliedConds({ [NODE_CONDS_KEY]: [{ cond: [condItem] }] });
  }

  public async callHook(nodeId: Id, hookName: string, hookData: { params: Record<string, any> }[]) {
    const node = this.app.getNode(nodeId);
    if (!node) {
      return;
    }

    for (const item of hookData) {
      await node.runHookCode(hookName, item.params);
    }
  }

  public trigger(nodeId: Id, events: EventConfig) {
    const node = this.app.getNode(nodeId);
    if (!node) {
      return;
    }

    this.app.emit(events.name, node);
  }

  public updateDsl(_nodeId: Id, _data: any, _path: string) {
    return;
  }

  public isValueIncludeDataSource(value: any) {
    return isValueIncludeDataSource(value);
  }

  public compileDataSourceValue(value: any) {
    return compiledNodeField(value, this.app.dataSourceManager?.data || {});
  }

  public updateCode(codeId: string, value: any, path: string) {
    if (!this.app.dsl) {
      return;
    }

    const { codeBlocks } = this.app.dsl;
    if (!codeBlocks) {
      return;
    }

    const code = codeBlocks[codeId];

    if (!code) {
      return;
    }

    const newCode = cloneDeep(code);
    // eslint-disable-next-line prefer-const
    let fuc = value;
    if (path === 'content' && typeof value === 'string' && (value.includes('function') || value.includes('=>'))) {
      // eslint-disable-next-line no-eval
      eval(`fuc = ${value})`);
    }

    setValueByKeyPath(path, fuc, newCode);

    codeBlocks[codeId] = newCode;
  }
}
