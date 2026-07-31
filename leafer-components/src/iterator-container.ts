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

import type { ShapeFn } from './utils'
import { buildPlaceholderRect } from './placeholder'

/**
 * iterator-container placeholder:数据源驱动的循环容器。
 * editor 端占位,运行时通过 dataSource 展开。
 */
const shape: ShapeFn = (config) => buildPlaceholderRect(config)

export default shape
