/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';

import type { MPage } from '@tmagic/core';
import { IS_DSL_NODE_KEY } from '@tmagic/core';
import { useApp, useComponentStatus } from '@tmagic/react-runtime-help';

interface PageProps {
  config: MPage;
}

const Page: React.FC<PageProps> = ({ config }) => {
  const { app } = useApp({
    config: { ...config, [IS_DSL_NODE_KEY]: true },
    methods: {
      refresh: () => window.location.reload(),
    },
  });

  if (!app) return null;

  const MagicUiComp = app.resolveComponent('container');

  const { style, className } = useComponentStatus({ config });

  return (
    <MagicUiComp
      config={{ ...config, [IS_DSL_NODE_KEY]: false }}
      id={config.id}
      className={className}
      style={style}
    ></MagicUiComp>
  );
};

Page.displayName = 'magic-ui-page';

export default Page;
