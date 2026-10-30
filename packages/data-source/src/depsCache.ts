import type { DataSourceSchema, MNode } from '@tmagic/core';
import {
  DSL_NODE_KEY_COPY_PREFIX,
  isDataSourceCondTarget,
  isDataSourceTarget,
  Target,
  traverseNode,
  Watcher,
} from '@tmagic/core';

interface CacheEntry {
  /** 计算依赖时的节点引用，用于判断节点是否被替换过 */
  refs: MNode[];
  result: any;
}

/**
 * 以第一个节点对象作为 WeakMap 的 key，节点被回收后缓存自动释放，
 * 不同数据源 / 是否在编辑器中的结果存放在内层 Map。
 * 通过比较节点对象引用（而不是 id）来判断缓存是否有效，节点被替换后（如修改了绑定的字段）会重新收集依赖
 */
const cache = new WeakMap<MNode, Map<string, CacheEntry>>();

const getRefs = (nodes: MNode[], inEditor: boolean) => {
  if (!inEditor) {
    return [...nodes];
  }

  const refs: MNode[] = [];
  nodes.forEach((node) => {
    traverseNode(node, (item) => {
      refs.push(item);
    });
  });
  return refs;
};

const isSameRefs = (a: MNode[], b: MNode[]) => a.length === b.length && a.every((item, index) => item === b[index]);

export const getDeps = (ds: DataSourceSchema, nodes: MNode[], inEditor: boolean) => {
  const refs = getRefs(nodes, inEditor);
  const cacheKey = `${ds.id}:${inEditor}`;
  const rootNode = nodes[0];

  const entry = rootNode ? cache.get(rootNode)?.get(cacheKey) : undefined;
  if (entry && isSameRefs(entry.refs, refs)) {
    return entry.result;
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

  if (rootNode) {
    const entries = cache.get(rootNode) ?? new Map<string, CacheEntry>();
    entries.set(cacheKey, { refs, result });
    cache.set(rootNode, entries);
  }

  return result;
};
