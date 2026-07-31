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

/**
 * 统一入口:editor 端可一次性 import 所有 shape。
 * 业务方也可单独 import `import buttonShape from '@leafer-components/button'`。
 *
 * 与 vue-components / react-components 对应关系:
 *   vue-components/button     ↔ leafer-components/button
 *   react-components/button    ↔ leafer-components/button
 *
 * leafer-components 仅为 editor 画布渲染使用,不要在 runtime 端使用。
 */

import button from './button'
import text from './text'
import img from './img'
import container from './container'
import overlay from './overlay'
import page from './page'
import qrcode from './qrcode'
import pageFragment from './page-fragment'
import pageFragmentContainer from './page-fragment-container'
import iteratorContainer from './iterator-container'

export { default as button } from './button'
export { default as text } from './text'
export { default as img } from './img'
export { default as container } from './container'
export { default as overlay } from './overlay'
export { default as page } from './page'
export { default as qrcode } from './qrcode'
export { default as pageFragment } from './page-fragment'
export { default as pageFragmentContainer } from './page-fragment-container'
export { default as iteratorContainer } from './iterator-container'

export {
  parsePx,
  parseShadow,
  parseGradient,
  parseFontWeight,
  normalizeColor,
  type ShapeFn,
  type ShapeContext,
  type ShapeWithChildren,
  type LeaferShadow,
  type LeaferFill,
  type LeaferColorStop,
} from './utils'

export { buildPlaceholderRect } from './placeholder'

// 业务方 `import * as lc from '@leafer-components'` 时拿到所有
export default {
  button,
  text,
  img,
  container,
  overlay,
  page,
  qrcode,
  pageFragment,
  pageFragmentContainer,
  iteratorContainer,
}
