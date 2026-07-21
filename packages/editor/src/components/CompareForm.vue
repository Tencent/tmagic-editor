<template>
  <div class="m-editor-compare-form-wrapper" :style="wrapperStyle">
    <MForm
      v-if="config.length"
      ref="form"
      class="m-editor-compare-form"
      :config="config"
      :init-values="currentValues"
      :last-values="lastValuesProcessed"
      :is-compare="true"
      :disabled="true"
      :label-width="labelWidth"
      :extend-state="mergedExtendState"
      :show-diff="showDiff"
      :self-diff-field-types="selfDiffFieldTypes"
      :size="size"
    ></MForm>
  </div>
</template>

<script lang="ts" setup>
import { computed, type Ref, type ShallowRef } from 'vue';
import { isEqual } from 'lodash-es';

import { type CodeBlockContent, HookType } from '@tmagic/core';
import { type FormConfig, type FormValue, MForm } from '@tmagic/form';

import { useCompareForm } from '@editor/hooks/use-compare-form';
import type { CompareFormBaseProps } from '@editor/type';

defineOptions({
  name: 'MEditorCompareForm',
});

const props = withDefaults(
  defineProps<
    CompareFormBaseProps & {
      /** 用于对比的旧值（修改前的值） */
      lastValue?: CompareFormBaseProps['value'];
      /** 需要走 self diff 的字段类型（例如 mod-cond）。 */
      selfDiffFieldTypes?: string[];
    }
  >(),
  {
    category: 'node',
    labelWidth: '120px',
  },
);

const { config, currentValues, wrapperStyle, mergedExtendState, loadConfig, formRef, normalizeCodeBlockValue } =
  useCompareForm(props);

const lastValuesProcessed = computed<FormValue>(() => {
  if (props.category === 'code-block') {
    return normalizeCodeBlockValue(props.lastValue as Partial<CodeBlockContent>);
  }
  return (props.lastValue || {}) as FormValue;
});

/**
 * `code-select` 字段在历史数据中存在两种"语义为空"的形态：
 * - 字符串 `''`（旧数据 / 用户从未配置过钩子）；
 * - `{ hookType: HookType.CODE, hookData: [] }`（CodeSelect.vue 在挂载时
 *   写入的默认结构，参见 packages/editor/src/fields/CodeSelect.vue 中
 *   `props.model[props.name] = { hookType: HookType.CODE, hookData: [] }`）。
 *
 * 直接 `isEqual` 会把两者判为不等，从而在历史对比里对每个未配置过钩子的组件
 * 都展示一份"差异"，体验很糟糕。这里把它们视为相等，跳过对比。
 *
 * 其它类型字段沿用 MForm/Container 的默认 `!isEqual` 判断逻辑。
 */
const isEmptyCodeSelectValue = (v: any): boolean => {
  if (v === '' || v === undefined || v === null) return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return typeof v === 'object' && v.hookType === HookType.CODE && Array.isArray(v.hookData) && v.hookData.length === 0;
};

const showDiff = ({ curValue, lastValue, config }: { curValue: any; lastValue: any; config: any }) => {
  if (config?.type === 'code-select') {
    // 双方都是"空形态"，视为相等，不展示对比
    if (isEmptyCodeSelectValue(curValue) && isEmptyCodeSelectValue(lastValue)) {
      return false;
    }
  }
  return !isEqual(curValue, lastValue);
};

defineExpose<{
  form: ShallowRef<InstanceType<typeof MForm> | null>;
  config: Ref<FormConfig>;
  reload: () => Promise<void>;
}>({
  form: formRef,
  config,
  reload: loadConfig,
});
</script>
