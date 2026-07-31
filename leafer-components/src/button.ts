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

import { Group, Rect, Text } from 'leafer-ui'

import type { MComponent } from '@tmagic/schema'

import {
  normalizeColor,
  parseFontWeight,
  parsePx,
  type ShapeFn,
} from './utils'

/**
 * 按钮 = Group[Rect(底色) + Text(文字)]
 * 与 vue-components/button 和 react-components/button 的 <button> 渲染对齐
 */
const shape: ShapeFn = (config) => {
  const c = config as MComponent & { text?: string }
  const w = parsePx(c.style?.width)
  const h = parsePx(c.style?.height)

  const group = new Group({
    x: parsePx(c.style?.left) ?? 0,
    y: parsePx(c.style?.top) ?? 0,
    width: w,
    height: h,
  })

  group.add(
    new Rect({
      width: w,
      height: h,
      fill: normalizeColor(c.style?.backgroundColor) ?? '#409EFF',
      cornerRadius: parsePx(c.style?.borderRadius) ?? 4,
    }),
  )

  group.add(
    new Text({
      text: c.text ?? '',
      fill: normalizeColor(c.style?.color) ?? '#fff',
      fontSize: parsePx(c.style?.fontSize) ?? 14,
      fontWeight: parseFontWeight(c.style?.fontWeight),
      fontFamily: c.style?.fontFamily,
      textAlign: 'center',
      verticalAlign: 'middle',
    }),
  )

  return group
}

export default shape
