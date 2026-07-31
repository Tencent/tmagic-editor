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

import { Rect } from 'leafer-ui'

import type { MComponent } from '@tmagic/core'

import { parsePx } from './utils'

/**
 * 通用占位矩形:浅灰背景 + 边框,供未实现 shape 的 type 使用。
 * qrcode / page-fragment / page-fragment-container / iterator-container 都用这个。
 */
export const buildPlaceholderRect = (config: MComponent): Rect => {
  const w = parsePx(config.style?.width) ?? 100
  const h = parsePx(config.style?.height) ?? 100
  return new Rect({
    width: w,
    height: h,
    fill: '#f5f5f5',
    stroke: { type: 'solid', color: '#ddd' } as any,
    strokeWidth: 1,
    cornerRadius: 4,
  })
}
