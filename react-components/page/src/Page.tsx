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

import { useApp } from '@tmagic/react-runtime-help';
import type { MPage } from '@tmagic/schema';

interface PageProps {
  config: MPage;
}

const Page: React.FC<PageProps> = ({ config }) => {
  const { app } = useApp({
    config,
    methods: {
      refresh: () => window.location.reload(),
    },
  });

  if (!app) return null;

  const MagicUiComp = app.resolveComponent('container');

  const classNames = ['magic-ui-page'];
  if (config.className) {
    classNames.push(config.className);
  }

  return <MagicUiComp config={config} id={config.id} className={classNames.join(' ')}></MagicUiComp>;
};

Page.displayName = 'magic-ui-page';

export default Page;
