import React from 'react';

import type { MContainer } from '@tmagic/schema';

import useApp from '../../useApp';

interface IteratorContainerProps extends MContainer {
  config: MContainer & {
    type: 'iterator-container';
    iteratorData: any[];
    dsField: string[];
    itemConfig: {
      layout: string;
      style: Record<string, string | number>;
    };
  };
  className: string;
  style: Record<string, any>;
  id: string;
}

const IteratorContainer: React.FC<IteratorContainerProps> = ({ config, id }) => {
  const { app } = useApp({ config });

  let { iteratorData = [] } = config;

  if (!Array.isArray(iteratorData)) {
    iteratorData = [];
  }

  if (app?.platform === 'editor' && !iteratorData.length) {
    iteratorData.push({});
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const MagicUiComp = app?.resolveComponent('container');
  return (
    <div
      id={`${id || config.id || ''}`}
      className="magic-ui-iterator-container"
      style={app?.transformStyle(config.style || {})}
    >
      {iteratorData.map((itemData, index) => {
        const itemConfig = {
          items: app?.dataSourceManager?.compliedIteratorItems(itemData, config.items, config.dsField) ?? config.items,
          id: '',
          style: {
            ...config.itemConfig.style,
            position: 'relative',
            left: 0,
            top: 0,
          },
        };
        return <MagicUiComp config={itemConfig} key={index}></MagicUiComp>;
      })}
    </div>
  );
};

IteratorContainer.displayName = 'magic-ui-iterator-container';

export default IteratorContainer;
