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

import type {
  ActionButtonConfig,
  CustomActionButtonConfig,
  CustomActionButtonContext,
  FormState,
} from '@tmagic/form-schema';

/** table / group-list 行操作的内置文案。空 text 与未配置一样回退到这里，与 addButtonConfig 一致 */
export const DEFAULT_ACTION_BUTTON_TEXT = {
  operate: '操作',
  delete: '删除',
  copy: '复制',
  dropSort: '拖动排序',
  moveUp: '上移',
  moveDown: '下移',
  moveTo: '移动至',
} as const;

export const actionButtonText = (
  config: ActionButtonConfig | undefined,
  key: keyof typeof DEFAULT_ACTION_BUTTON_TEXT,
): string => config?.text || DEFAULT_ACTION_BUTTON_TEXT[key];

export interface ResolvedCustomActionButton {
  button: CustomActionButtonConfig;
  disabled: boolean;
  onClick: () => void;
}

/** 解析自定义行操作按钮：过滤掉不显示的，并计算禁用状态与点击回调 */
export const resolveCustomActionButtons = (
  mForm: FormState | undefined,
  buttons: CustomActionButtonConfig[] | undefined,
  ctx: CustomActionButtonContext,
  formDisabled?: boolean,
): ResolvedCustomActionButton[] => {
  if (!Array.isArray(buttons)) return [];

  return buttons
    .filter(({ display }) => (typeof display === 'function' ? display(mForm, ctx) : (display ?? true)))
    .map((button) => {
      const { disabled } = button;
      return {
        button,
        disabled: Boolean(formDisabled) || Boolean(typeof disabled === 'function' ? disabled(mForm, ctx) : disabled),
        onClick: () => button.handler(mForm, ctx),
      };
    });
};
