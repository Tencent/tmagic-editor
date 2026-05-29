import {
  createCodeBlockTarget,
  createDataSourceCondTarget,
  createDataSourceMethodTarget,
  createDataSourceTarget,
  type DepData,
  DepTargetType,
  type Id,
  type MApp,
  traverseTarget,
  Watcher,
} from '@tmagic/core';

import { error } from '../logger';

onmessage = (e) => {
  const watcher = new Watcher({ initialTargets: {} });

  const { dsl } = e.data;

  try {
    // eslint-disable-next-line no-eval
    const mApp: MApp = eval(`(${dsl})`);

    if (!mApp) {
      postMessage({});
    }

    watcher.clearTargets();

    if (mApp.codeBlocks) {
      for (const [id, code] of Object.entries(mApp.codeBlocks)) {
        watcher.addTarget(createCodeBlockTarget(id, code));
      }
    }

    if (mApp.dataSources) {
      for (const ds of mApp.dataSources) {
        watcher.addTarget(createDataSourceTarget(ds, {}));
        watcher.addTarget(createDataSourceMethodTarget(ds, {}));
        watcher.addTarget(createDataSourceCondTarget(ds, {}));
      }
    }

    // worker 中 target 均为新建（deps 为空），无需删除阶段，直接批量收集
    const targets = watcher.getCollectableTargets();
    for (const page of mApp.items) {
      watcher.collectItems(page, targets, { pageId: page.id }, true);
    }

    const data: Record<string, Record<Id, DepData>> = {
      [DepTargetType.DATA_SOURCE]: {},
      [DepTargetType.DATA_SOURCE_METHOD]: {},
      [DepTargetType.DATA_SOURCE_COND]: {},
      [DepTargetType.CODE_BLOCK]: {},
    };

    traverseTarget(watcher.getTargetsList(), (target) => {
      data[target.type][target.id] = target.deps;
    });

    postMessage(data);
  } catch (e: any) {
    error(e);
    postMessage({});
  }
};
