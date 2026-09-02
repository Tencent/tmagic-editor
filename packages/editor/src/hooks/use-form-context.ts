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

import { computed, type ComputedRef, inject, unref } from 'vue';

import { FORM_CONTEXT_KEY, type FormContext, mergeFormContexts } from '@tmagic/form';

import type { Services } from '@editor/type';

/**
 * 编辑器注入给表单的业务上下文：`services` 与当前画布 `stage`。
 *
 * 由 `Editor.vue`（provide `FORM_CONTEXT_KEY`）、`FormPanel.vue` 与 `useCompareForm`
 * 共用。`stage` 走 computed 而非快照，保证切换画布后配置回调读到的是最新实例。
 *
 * 宿主可能在 `<MEditor>` 外层 provide 了自己的业务字段，这里必须把那一层合并进来：
 * 否则编辑器再 provide 一次会把宿主整层遮蔽掉，属性面板、对比表单里的配置回调就
 * 读不到宿主字段了。`services` / `stage` 由编辑器兜底，优先级高于宿主同名字段。
 *
 * 字段类型见 `@editor/type` 里对 `@tmagic/form-schema` 的 `FormContext` 模块增强。
 */
export const useEditorFormContext = (getServices: () => Services | undefined): ComputedRef<FormContext> => {
  // inject 只能在 setup 期取值，因此本 hook 必须在 setup 中调用（`use` 前缀即此约定）。
  // 返回的 computed 可以随便传递，但 hook 本身不能延迟到事件回调或 onMounted 里再调。
  const hostContext = inject(FORM_CONTEXT_KEY, undefined);

  return computed(() => {
    const services = getServices();
    const host = unref(hostContext);

    // 上层（通常是 Editor.vue）已经用同一份 services 合并过了。FormPanel / useCompareForm
    // 都是它的后代，再合并一次只会多套一层 Proxy，让每次属性 miss 多一轮线性查找。
    // services 相同即可判定 stage 也相同——两边都是从同一个 editorService 读的。
    if (host && host.services === services) return host;

    return mergeFormContexts(host, {
      services,
      stage: services?.editorService.get('stage'),
    });
  });
};
