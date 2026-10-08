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

import { tMagicMessage } from '@tmagic/design';
import type { FormConfig } from '@tmagic/form';

import type { FillConfigOptions } from '@editor/sdk/utils/props';
import { fillConfig as sdkFillConfig } from '@editor/sdk/utils/props';

export * from '@editor/sdk/utils/props';

/** 浏览器端默认用 `navigator.clipboard` 复制，并用 `tMagicMessage` 提示 */
export const copyTextToClipboard = (text: string): Promise<void> => navigator.clipboard.writeText(text);

export const notifyByDesign = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
  const fn = (tMagicMessage as any)[type] ?? tMagicMessage;
  fn(message);
};

/** 与 SDK 的 `fillConfig` 一致，区别是默认接入浏览器的剪贴板与消息提示 */
export const fillConfig = (config: FormConfig = [], options: FillConfigOptions = {}): FormConfig =>
  sdkFillConfig(config, {
    copyText: copyTextToClipboard,
    notify: notifyByDesign,
    ...options,
  });
