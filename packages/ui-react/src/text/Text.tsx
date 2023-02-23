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

import React, { useState } from 'react';

import { Reactive } from '@tmagic/core';
import type { MComponent } from '@tmagic/schema';

import useApp from '../useApp';

interface TextProps {
  config: MComponent;
}

const Text: React.FC<TextProps> = ({ config }) => {
  const { app, ref, created } = useApp({ config });

  if (!app) return null;

  const [displayText, setDisplayText] = useState(config.text);
  // 数据响应式更新
  if (!created) Reactive.reaction(() => config.text,() => setDisplayText(config.text));

  return (
    <div ref={ref} className="magic-ui-text" style={app.transformStyle(config.style || {})} id={`${config.id || ''}`}>
      {displayText}
    </div>
  );
};

Text.displayName = 'maigc-ui-text';

export default Text;
