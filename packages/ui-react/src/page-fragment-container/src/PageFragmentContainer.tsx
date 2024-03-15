import React, { constructor, useEffect, useMemo, useState } from 'react';

import type { MComponent, MContainer, MNode, MPage, MPageFragment } from '@tmagic/schema';

import useApp from '../../useApp';
interface PageFragmentContainerProps {
  config: MComponent;
}

const PageFragmentContainer: React.FC<PageFragmentContainerProps> = ({ config }) => {
  const { app } = useApp({
    config,
    methods: {},
  });

  if (!app) return null;
  const MagicUiContainer = app.resolveComponent('container');
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

  return (
    <div
      id={`${config.id || ''}`}
      className="magic-ui-page-fragment-container"
      style={app.transformStyle(config.style || {})}
    >
      <MagicUiContainer config={containerConfig}></MagicUiContainer>
    </div>
  );
};

PageFragmentContainer.displayName = 'magic-ui-page-fragment-container';

export default PageFragmentContainer;
