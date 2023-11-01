import type { Id } from '@tmagic/schema';
import { getKeys } from '@tmagic/utils';

import type { LayerNodeStatus } from '@editor/type';

export const updateStatus = (nodeStatusMap: Map<Id, LayerNodeStatus>, id: Id, status: Partial<LayerNodeStatus>) => {
  const nodeStatus = nodeStatusMap.get(id);

  if (!nodeStatus) return;
  getKeys(status).forEach((key) => {
    if (nodeStatus[key] !== undefined && status[key] !== undefined) {
      nodeStatus[key] = Boolean(status[key]);
    }
  });
};
