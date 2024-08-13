import React from 'react';

import { useApp } from '@tmagic/react-runtime-help';
import type { Id, MComponent, MNode } from '@tmagic/schema';

interface PageFragmentContainerProps {
  config: MComponent;
  className: string;
  style: Record<string, any>;
  id: string;
  containerIndex: number;
  iteratorIndex: number[];
  iteratorContainerId: Id[];
}

const PageFragmentContainer: React.FC<PageFragmentContainerProps> = ({   config,
  id,
  style,
  className,
  containerIndex,
  iteratorIndex,
  iteratorContainerId, }) => {
  const { app } = useApp({
    config,
    methods: {},
  });

  if (!app) return null;

  let containerConfig = {};
  const fragment = app?.dsl?.items?.find((page) => page.id === config.pageFragmentId);
  if (fragment) {
    const { id, type, items, ...others } = fragment;
    const itemsWithoutId = items.map((item: MNode) => {
      const { id, ...otherConfig } = item;
      return otherConfig;
    });
    if (app?.platform === 'editor') {
      containerConfig = {
        ...others,
        items: itemsWithoutId,
      };
    } else {
      containerConfig = {
        ...others,
        items,
      };
    }
  }

  const MagicUiContainer = app.resolveComponent('container');

  const classNames = ['magic-ui-page-fragment-container'];
  if (className) {
    classNames.push(className);
  }

  return (
    <div
      data-tmagic-id={`${id || ''}`}
      data-container-index={containerIndex}
      data-tmagic-iterator-index={iteratorIndex}
      data-tmagic-iterator-container-id={iteratorContainerId}
      className={classNames.join(' ')}
      style={style}
    >
      <MagicUiContainer config={containerConfig}></MagicUiContainer>
    </div>
  );
};

PageFragmentContainer.displayName = 'magic-ui-page-fragment-container';

export default PageFragmentContainer;
