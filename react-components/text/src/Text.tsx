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

import type { Id, MComponent } from '@tmagic/core';
import { COMMON_EVENT_PREFIX } from '@tmagic/core';
import { useApp } from '@tmagic/react-runtime-help';

interface TextSchema extends Omit<MComponent, 'id'> {
  id?: Id;
  type?: 'text';
  text: string;
}

interface TextProps {
  id: Id;
  config: TextSchema;
  className: string;
  style: Record<string, any>;
  containerIndex: number;
  iteratorIndex?: number[];
  iteratorContainerId?: Id[];
}

const Text: React.FC<TextProps> = ({
  id,
  config,
  className,
  style,
  containerIndex,
  iteratorIndex,
  iteratorContainerId,
}) => {
  const { app, node } = useApp({ config, iteratorIndex, iteratorContainerId });

  if (!app) return null;

  const clickHandler = () => {
    if (node && app) {
      app.emit(`${COMMON_EVENT_PREFIX}click`, node);
    }
  };

  return (
    <p
      className={className}
      style={style}
      data-tmagic-id={`${id || config.id || ''}`}
      data-tmagic-container-index={containerIndex}
      data-tmagic-iterator-index={iteratorIndex}
      data-tmagic-iterator-container-id={iteratorContainerId}
      onClick={clickHandler}
    >
      {config.text}
    </p>
  );
};

Text.displayName = 'magic-ui-text';

export default Text;
