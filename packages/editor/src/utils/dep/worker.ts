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

    watcher.collectByCallback(mApp.items, undefined, ({ node, target }) => {
      watcher.collectItem(node, target, { pageId: node.id }, true);
    });

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
