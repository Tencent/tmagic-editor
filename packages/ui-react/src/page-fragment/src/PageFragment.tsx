import React from 'react';

import type { MComponent, MContainer, MPageFragment } from '@tmagic/schema';

import useApp from '../../useApp';
interface PageFragmentProps {
  config: MPageFragment;
}

const PageFragment: React.FC<PageFragmentProps> = ({ config }) => {
  const { app } = useApp({
    config,
    methods: {},
  });

  if (!app) return null;

  return (
    <div
      id={`${config.id || ''}`}
      className={`magic-ui-page-fragment magic-ui-container magic-layout-${config.layout}${
        config.className ? ` ${config.className}` : ''
      }`}
      style={app.transformStyle(config.style || {})}
    >
      {config.items?.map((item: MComponent | MContainer) => {
        const MagicUiComp = app.resolveComponent(item.type || 'container');

        if (!MagicUiComp) return null;

        if (item.visible === false) return null;
        if (item.condResult === false) return null;

        return (
          <MagicUiComp
            id={`${item.id || ''}`}
            key={item.id}
            config={item}
            className={`magic-ui-component${config.className ? ` ${config.className}` : ''}`}
            style={app.transformStyle(item.style || {})}
          ></MagicUiComp>
        );
      })}
    </div>
  );
};

PageFragment.displayName = 'magic-ui-page-fragment';

export default PageFragment;
