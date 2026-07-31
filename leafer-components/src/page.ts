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

import type { MPage } from '@tmagic/schema'

import { parsePx, type ShapeFn, type ShapeWithChildren } from './utils'

/**
 * page = 根 Frame,持有 items。
 * 与 vue-components/page 行为对齐(page 渲染为容器组件,内含 items)。
 */
const shape: ShapeFn = (config, _ctx): ShapeWithChildren => {
  const c = config as MPage
  const node = new Frame({
    x: parsePx(c.style?.left) ?? 0,
    y: parsePx(c.style?.top) ?? 0,
    width: parsePx(c.style?.width),
    height: parsePx(c.style?.height),
    fill: c.style?.backgroundColor as string | undefined,
  })
  return { node, children: c.items ?? [] }
}

export default shape
