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

import { computed, type ComputedRef } from 'vue';

import type { FormContext } from '@tmagic/form';

import type { Services } from '@editor/type';

/**
 * 编辑器注入给表单的业务上下文：`services` 与当前画布 `stage`。
 *
 * 由 `Editor.vue`（provide `FORM_CONTEXT_KEY`）、`FormPanel.vue` 与 `useCompareForm`
 * 共用。`stage` 走 computed 而非快照，保证切换画布后配置回调读到的是最新实例。
 *
 * 字段类型见 `@editor/type` 里对 `@tmagic/form-schema` 的 `FormContext` 模块增强。
 */
export const useEditorFormContext = (getServices: () => Services | undefined): ComputedRef<FormContext> =>
  computed(() => {
    const services = getServices();
    return {
      services,
      stage: services?.editorService.get('stage'),
    };
  });
