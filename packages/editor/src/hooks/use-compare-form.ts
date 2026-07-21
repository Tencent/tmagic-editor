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

import { computed, type ComputedRef, inject, provide, type Ref, ref, useTemplateRef, watch, watchEffect } from 'vue';

import type { CodeBlockContent, MNode } from '@tmagic/core';
import { type FormConfig, type FormState, type FormValue, MForm } from '@tmagic/form';

import type { CompareFormBaseProps } from '@editor/type';
import { getCodeBlockFormConfig } from '@editor/utils/code-block';
import { removeStyleDisplayConfig } from '@editor/utils/props';

export interface UseCompareFormReturn {
  config: Ref<FormConfig>;
  currentValues: ComputedRef<FormValue>;
  wrapperStyle: ComputedRef<Record<string, string> | undefined>;
  mergedExtendState: (state: FormState) => Record<string, any> | Promise<Record<string, any>>;
  loadConfig: () => Promise<void>;
  formRef: Readonly<Ref<InstanceType<typeof MForm> | null>>;
  normalizeCodeBlockValue: (v: Partial<CodeBlockContent> | Record<string, any> | undefined) => Record<string, any>;
}

/**
 * CompareForm / ViewForm 共用逻辑：
 * - 按 `category`(node / data-source / code-block) 加载 FormConfig（支持自定义 `loadConfig`）；
 * - 代码块 `content` 归一化为字符串；
 * - 外层容器固定高度 + 内部滚动的 `wrapperStyle`；
 * - 将 services / stage 注入 MForm.formState，保证 filterFunction 上下文一致。
 *
 * 两个组件的差异仅在于是否做新旧值对比，这部分逻辑保留在各自组件中。
 */
export const useCompareForm = (props: CompareFormBaseProps): UseCompareFormReturn => {
  provide('services', props.services);

  const config = ref<FormConfig>([]);

  /** vs-code 编辑器的 monaco 配置项，沿用 Editor 顶层 provide('codeOptions', ...) 的注入。 */
  const codeOptions = inject<Record<string, any>>('codeOptions', {});

  /** 将代码块的 content 字段统一成字符串，便于在表单 / 对比中展示 */
  const normalizeCodeBlockValue = (
    v: Partial<CodeBlockContent> | Record<string, any> | undefined,
  ): Record<string, any> => {
    if (!v) return {};
    const next: Record<string, any> = { ...v };
    if (next.content && typeof next.content !== 'string') {
      try {
        next.content = next.content.toString();
      } catch {
        next.content = '';
      }
    }
    return next;
  };

  const currentValues = computed<FormValue>(() => {
    if (props.category === 'code-block') {
      return normalizeCodeBlockValue(props.value as Partial<CodeBlockContent>);
    }
    return (props.value || {}) as FormValue;
  });

  /**
   * 外层包裹层的样式：当传入 `height` 时启用固定高度 + 内部滚动，
   * 这样滚动条会出现在组件内部，避免父容器（如 Dialog）自身也产生滚动。
   */
  const wrapperStyle = computed(() => {
    if (!props.height) return undefined;
    const style: Record<string, string> = {
      height: props.height,
      overflow: 'auto',
    };
    return style;
  });

  const mergedExtendState = (state: FormState) => {
    const extendState = props.extendState ?? ((s: FormState) => s);
    return extendState(props.baseFormState || state);
  };

  /**
   * 内置的默认 FormConfig 加载逻辑：按 `category` 从对应 service / 工具取配置。
   * 作为 ctx.defaultLoadConfig 透传给自定义 `loadConfig`，方便复用与二次加工。
   */
  const defaultLoadConfig = async (): Promise<FormConfig> => {
    if (!props.services) {
      return [];
    }

    switch (props.category) {
      case 'node': {
        if (!props.type) {
          return [];
        }
        return removeStyleDisplayConfig(
          await props.services.propsService.getPropsConfig(props.type, { node: props.value as unknown as MNode }),
        );
      }
      case 'data-source': {
        const config = props.services.dataSourceService.getFormConfig(props.type || 'base');
        // 数据源表单外层 tab 的「数据定义」项 status 为 'fields'，tab-pane name 随之为 'fields'。
        // 未显式设置 active 时，Tabs 默认取 '0'，与 'fields' 不匹配会导致打开弹窗时无默认激活项，
        // 这里与 DataSourceConfigPanel 保持一致，默认激活「数据定义」tab。
        return config.map((item) => ('type' in item && item.type === 'tab' ? { ...item, active: 'fields' } : item));
      }
      case 'code-block': {
        return getCodeBlockFormConfig({
          paramColConfig: props.services.codeBlockService.getParamsColConfig(),
          // 通过传入 dataSourceType 间接表达"是数据源代码块"——在对比 / 展示场景下 props.dataSourceType
          // 由调用方按 step 上下文显式传入，未传则视为普通代码块，「执行时机」字段隐藏。
          isDataSource: () => Boolean(props.dataSourceType),
          dataSourceType: () => props.dataSourceType,
          codeOptions,
          // 对比 / 展示模式只读，不需要校验/语法检查
          editable: false,
        });
      }
      default:
        return [];
    }
  };

  const loadConfig = async () => {
    if (props.loadConfig) {
      config.value = await props.loadConfig({
        category: props.category as string,
        type: props.type,
        dataSourceType: props.dataSourceType,
        defaultLoadConfig,
      });
      return;
    }

    config.value = await defaultLoadConfig();
  };

  watch(
    [() => props.category, () => props.type, () => props.dataSourceType, () => props.loadConfig],
    () => {
      loadConfig();
    },
    { immediate: true },
  );

  const formRef = useTemplateRef<InstanceType<typeof MForm>>('form');

  /**
   * 把 services / stage 注入 MForm 的 formState，避免 propsService 注入的表单配置中
   * 形如 `display: ({ services }) => services.uiService.get(...)` 的 filterFunction
   * 在执行时拿不到 `formState.services` 而报错。
   *
   * 与 props-panel/FormPanel.vue 中的注入方式保持一致：
   * - services：整个 useServices() 返回的服务集合；
   * - stage：当前 editorService.get('stage') 的最新值。
   */
  watchEffect(() => {
    if (formRef.value && props.services) {
      formRef.value.formState.stage = props.services.editorService.get('stage');
      formRef.value.formState.services = props.services;
    }
  });

  return {
    config,
    currentValues,
    wrapperStyle,
    mergedExtendState,
    loadConfig,
    formRef,
    normalizeCodeBlockValue,
  };
};
