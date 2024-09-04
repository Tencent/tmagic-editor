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

import StageCore from './StageCore';

export * from 'moveable';
export type { GuidesOptions } from '@scena/guides';

export { default as StageRender } from './StageRender';
export { default as StageMask } from './StageMask';
export { default as StageDragResize } from './StageDragResize';
export * from './types';
export * from './const';
export * from './util';
export * from './MoveableActionsAble';
export { default as MoveableActionsAble } from './MoveableActionsAble';

export default StageCore;
