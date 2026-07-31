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

import { Frame } from 'leafer-ui'

import type { MContainer } from '@tmagic/schema'

import {
  normalizeColor,
  parsePx,
  type ShapeFn,
  type ShapeWithChildren,
} from './utils'

/**
 * overlay = 同 container,业务方可后续区分(置顶 / 模态 / fixed 定位等)
 */
const shape: ShapeFn = (config, _ctx): ShapeWithChildren => {
  const c = config as MContainer
  const node = new Frame({
    x: parsePx(c.style?.left) ?? 0,
    y: parsePx(c.style?.top) ?? 0,
    width: parsePx(c.style?.width),
    height: parsePx(c.style?.height),
    fill: normalizeColor(c.style?.backgroundColor),
    cornerRadius: parsePx(c.style?.borderRadius),
  })
  return { node, children: c.items ?? [] }
}

export default shape
