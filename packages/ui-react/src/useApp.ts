/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
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

import { useContext, useEffect, useState } from 'react';

import Core from '@tmagic/core';
import type { MComponent } from '@tmagic/schema';

import AppContent from './AppContent';

interface UseAppOptions {
  config: MComponent;
  methods?: {
    string: Function;
  };
}

export default ({ config, methods }: UseAppOptions) => {
  const app: Core = useContext(AppContent);
  const node = app?.page?.getNode(config.id);
  const [created, setCreated] = useState(false);

  if (!created) {
    // 只需要触发一次 created
    setCreated(true);
    node?.emit('created', { methods });
  }

  useEffect(() => {
    const emitData = {
      config,
      ...methods,
    };

    node?.emit('mounted', emitData);

    return () => {
      node?.emit('destroy', emitData);
    };
  }, []);

  return { app };
};
