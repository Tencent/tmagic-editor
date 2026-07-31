/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
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

import { Text } from 'leafer-ui'

import type { MComponent } from '@tmagic/schema'

import {
  normalizeColor,
  parseFontWeight,
  parsePx,
  type ShapeFn,
} from './utils'

const shape: ShapeFn = (config) => {
  const c = config as MComponent & { text?: string }
  return new Text({
    text: c.text ?? '',
    x: parsePx(c.style?.left) ?? 0,
    y: parsePx(c.style?.top) ?? 0,
    width: parsePx(c.style?.width),
    height: parsePx(c.style?.height),
    fill: normalizeColor(c.style?.color),
    fontSize: parsePx(c.style?.fontSize) ?? 14,
    fontWeight: parseFontWeight(c.style?.fontWeight),
    fontFamily: c.style?.fontFamily,
    textAlign: c.style?.textAlign ?? 'left',
    fontStyle: c.style?.fontStyle,
    lineHeight: parsePx(c.style?.lineHeight),
    letterSpacing: parsePx(c.style?.letterSpacing),
  })
}

export default shape
