import type { Id } from '@tmagic/core';
import { getKeys } from '@tmagic/utils';

import type { IsExpandableFunction, LayerNodeStatus } from '@editor/type';

export const updateStatus = (nodeStatusMap: Map<Id, LayerNodeStatus>, id: Id, status: Partial<LayerNodeStatus>) => {
  const nodeStatus = nodeStatusMap.get(id);

  if (!nodeStatus) return;
  getKeys(status).forEach((key) => {
    if (nodeStatus[key] !== undefined && status[key] !== undefined) {
      nodeStatus[key] = Boolean(status[key]);
    }
  });
};

/** 默认的组件树节点是否可展开的判断函数：当节点的子项中至少存在一个可见节点时认为可展开 */
export const defaultIsExpandable: IsExpandableFunction = (data, nodeStatusMap) =>
  Array.isArray(data.items) && data.items.some((item) => nodeStatusMap.get(item.id)?.visible);
