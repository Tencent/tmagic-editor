import { isDataSourceCondTarget, isDataSourceTarget, Target, Watcher } from '@tmagic/dep';
import type { DataSourceSchema, MNode } from '@tmagic/schema';
import { DSL_NODE_KEY_COPY_PREFIX } from '@tmagic/utils';

const cache = new Map();

export const getDeps = (ds: DataSourceSchema, nodes: MNode[]) => {
  const cacheKey = `${ds.id}:${nodes.map((node) => node.id).join(':')}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const watcher = new Watcher();
  watcher.addTarget(
    new Target({
      id: ds.id,
      type: 'data-source',
      isTarget: (key: string | number, value: any) => {
        if (`${key}`.includes(DSL_NODE_KEY_COPY_PREFIX)) {
          return false;
        }

        return isDataSourceTarget(ds, key, value, true);
      },
    }),
  );

  watcher.addTarget(
    new Target({
      id: ds.id,
      type: 'cond',
      isTarget: (key, value) => isDataSourceCondTarget(ds, key, value, true),
    }),
  );

  watcher.collect(nodes, {}, true);

  const { deps } = watcher.getTarget(ds.id, 'data-source');
  const { deps: condDeps } = watcher.getTarget(ds.id, 'cond');

  const result = { deps, condDeps };

  cache.set(cacheKey, result);

  return result;
};
