import { useEffect, useState } from 'react';
import { cloneDeep } from 'lodash-es';

import type { ChangeEvent, MNode } from '@tmagic/core';
import type TMagicApp from '@tmagic/core';
import { isPage, replaceChildNode } from '@tmagic/core';

export const useDsl = (app: TMagicApp | undefined) => {
  if (!app?.page) return null;

  const [pageConfig, setPageConfig] = useState(app.page.data);

  const updateDataHandler = (nodes: MNode[], sourceId: string, event: ChangeEvent) => {
    let config = pageConfig;
    nodes.forEach((node) => {
      if (isPage(node)) {
        config = node;
      } else {
        replaceChildNode(node, [config]);
      }
    });

    setPageConfig(cloneDeep(config));

    setTimeout(() => {
      app.emit('replaced-node', {
        ...event,
        nodes,
        sourceId,
      });
    }, 0);
  };

  useEffect(() => {
    app.dataSourceManager?.on('update-data', updateDataHandler);

    return () => {
      app.dataSourceManager?.off('update-data', updateDataHandler);
    };
  }, []);

  return { pageConfig };
};
