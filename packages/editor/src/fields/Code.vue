<template>
  <MagicCodeEditor
    v-if="!silentMode"
    :height="config.height"
    :type="diffMode ? 'diff' : undefined"
    :init-values="diffMode ? (lastValues || {})[name] : model[name]"
    :modified-values="diffMode ? model[name] : undefined"
    :language="config.language"
    :options="{
      ...config.options,
      readOnly: diffMode ? true : disabled,
    }"
    :autosize="config.autosize"
    :parse="config.parse"
    :editor-custom-type="config.mFormItemType"
    @save="save"
  ></MagicCodeEditor>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';

import { type CodeConfig, type FieldProps, FORM_SILENT_MODE_KEY } from '@tmagic/form';

import MagicCodeEditor from '@editor/layouts/CodeEditor.vue';

defineOptions({
  name: 'MFieldsVsCode',
});

/**
 * 静默模式（submitForm/validateForm 隐藏挂载）下跳过 monaco 渲染：
 * 校验由 FormItem 针对 model 中的值完成，与编辑器实例无关；本组件挂载无值副作用
 * （save 仅由用户操作/编辑器内容变更触发），跳过可省去 monaco worker/model 的无谓实例化。
 */
const silentMode = inject(FORM_SILENT_MODE_KEY, false);

const emit = defineEmits<{
  change: [value: string | any];
}>();

const props = withDefaults(defineProps<FieldProps<CodeConfig>>(), {
  disabled: false,
});

/**
 * 对比模式判定：
 *
 * - 当 `isCompare === true` 时，由父级 `MFormContainer` 统一渲染一次本字段（不再渲染前后两份独立组件），
 *   并把 `model`（当前值）与 `lastValues`（历史值）一并传入；
 * - 此时本字段切换到 monaco 自带的 diff 编辑器（左侧旧、右侧新），相比"两个独立 monaco 实例"更直观，
 *   也避免了同一表单内重复实例化重型编辑器带来的开销。
 *
 * 仅当存在历史值（lastValues）且开启了对比模式时启用 diff，避免在 lastValues 缺失时退化为空对比。
 */
const diffMode = computed(() => Boolean(props.isCompare && props.lastValues));

const save = (v: string | any) => {
  emit('change', v);
};
</script>
