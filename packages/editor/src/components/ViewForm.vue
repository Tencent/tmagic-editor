<template>
  <div class="m-editor-view-form-wrapper" :style="wrapperStyle">
    <MForm
      v-if="config.length"
      ref="form"
      class="m-editor-view-form"
      :config="config"
      :init-values="currentValues"
      :disabled="disabled"
      :label-width="labelWidth"
      :extend-state="mergedExtendState"
      :size="size"
    ></MForm>
  </div>
</template>

<script lang="ts" setup>
import { type Ref, type ShallowRef } from 'vue';

import { type FormConfig, MForm } from '@tmagic/form';

import { useCompareForm } from '@editor/hooks/use-compare-form';
import type { CompareFormBaseProps } from '@editor/type';

defineOptions({
  name: 'MEditorViewForm',
});

const props = withDefaults(
  defineProps<
    CompareFormBaseProps & {
      /** 是否禁用表单（默认只读展示）。 */
      disabled?: boolean;
    }
  >(),
  {
    category: 'node',
    labelWidth: '120px',
    disabled: true,
    // extendState 的默认值由 useCompareForm 内部兜底（props.extendState ?? ...），此处无需重复提供
  },
);

const { config, currentValues, wrapperStyle, mergedExtendState, loadConfig, formRef } = useCompareForm(props);

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
