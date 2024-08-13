import React from 'react';

import type { IteratorContainer as TMagicIteratorContainer } from '@tmagic/core';
import { useApp } from '@tmagic/react-runtime-help';
import type { Id, MIteratorContainer, MNode } from '@tmagic/schema';

interface IteratorContainerSchema extends Omit<MIteratorContainer, 'id'> {
  id?: Id;
  type?: 'iterator-container';
}

interface IteratorContainerProps {
  config: IteratorContainerSchema;
  className: string;
  style: Record<string, any>;
  id: string;
  containerIndex: number;
  iteratorIndex: number[];
  iteratorContainerId: Id[];
}

interface IteratorItemSchema {
  items: MNode[];
  condResult: boolean;
  style: {
    [key: string]: any;
  };
}

const IteratorContainer: React.FC<IteratorContainerProps> = ({
  config,
  id,
  style,
  className,
  containerIndex,
  iteratorIndex,
  iteratorContainerId,
}) => {
  const { app } = useApp({ config, iteratorIndex, iteratorContainerId });

  let { iteratorData = [] } = config;
  const { itemConfig, dsField, items } = config;

  if (!Array.isArray(iteratorData)) {
    iteratorData = [];
  }

  if (app?.platform === 'editor' && !iteratorData.length) {
    iteratorData.push({});
  }

  const MagicUiComp = app?.resolveComponent('container');

  const iteratorContainerNode = app?.getNode<TMagicIteratorContainer>(
    id || config.id || '',
    iteratorContainerId,
    iteratorIndex,
  );

  iteratorContainerNode?.resetNodes();

  const configs: IteratorItemSchema[] = iteratorData.map((itemData: any, index: number) => {
    const condResult =
      app?.platform !== 'editor'
        ? app?.dataSourceManager?.compliedIteratorItemConds(itemData, itemConfig, dsField) ?? true
        : true;

    const newItems = app?.dataSourceManager?.compliedIteratorItems(itemData, items, dsField) ?? items;

    iteratorContainerNode?.setNodes(config.items, index);

    return {
      items: newItems,
      condResult,
      style: {
        position: 'relative',
        left: 0,
        top: 0,
        ...itemConfig.style,
      },
    };
  });

  return (
    <div
      className={className}
      style={style}
      data-tmagic-id={`${id || config.id || ''}`}
      data-container-index={containerIndex}
      data-iterator-index={iteratorIndex}
      data-iterator-container-id={iteratorContainerId}
    >
      {configs.map((config: any, index: number) => (
        <MagicUiComp
          config={config}
          key={index}
          style={app?.transformStyle(config.style)}
          iteratorIndex={[...(iteratorIndex || []), index]}
          iteratorContainerId={[...(iteratorContainerId || []), config.id]}
        ></MagicUiComp>
      ))}
    </div>
  );
};

IteratorContainer.displayName = 'magic-ui-iterator-container';

export default IteratorContainer;
