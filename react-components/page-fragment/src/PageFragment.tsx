import React from 'react';

import { useApp } from '@tmagic/react-runtime-help';
import type { MPageFragment } from '@tmagic/schema';

interface PageFragmentProps {
  config: MPageFragment;
}

const PageFragment: React.FC<PageFragmentProps> = ({ config }) => {
  const { app } = useApp({
    config,
    methods: {},
  });

  if (!app) return null;

  const MagicUiComp = app.resolveComponent('container');
  const classNames = ['magic-ui-page-fragment'];
  if (config.className) {
    classNames.push(config.className);
  }

  return <MagicUiComp config={config} id={config.id} className={classNames.join(' ')}></MagicUiComp>;
};

PageFragment.displayName = 'magic-ui-page-fragment';

export default PageFragment;
