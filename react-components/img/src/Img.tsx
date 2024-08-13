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
import type { Id, MComponent } from '@tmagic/schema';

interface ImgSchema extends Omit<MComponent, 'id'> {
  id?: Id;
  type?: 'img';
  src: string;
  url?: string;
}

interface ImgProps {
  config: ImgSchema;
  className: string;
  id: string;
  style: Record<string, any>;
  containerIndex: number;
  iteratorIndex?: number[];
  iteratorContainerId?: Id[];
}

const Img: React.FC<ImgProps> = ({
  id,
  config,
  className,
  style,
  containerIndex,
  iteratorIndex,
  iteratorContainerId,
}) => {
  const { app } = useApp({ config, iteratorIndex, iteratorContainerId });

  if (!app) return null;

  const clickHandler = () => {
    if (config.url) window.location.href = config.url;
  };

  return (
    <img
      className={className}
      style={style}
      data-tmagic-id={`${id || config.id || ''}`}
      data-tmagic-container-index={containerIndex}
      data-tmagic-iterator-index={iteratorIndex}
      data-tmagic-iterator-container-id={iteratorContainerId}
      src={config.src}
      onClick={clickHandler}
    />
  );
};

Img.displayName = 'magic-ui-img';

export default Img;
