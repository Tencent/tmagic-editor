<template>
  <MagicCodeEditor
    :height="config.height"
    :init-values="model[name]"
    :language="config.language"
    :options="{
      ...config.options,
      readOnly: disabled,
    }"
    :autosize="config.autosize"
    :parse="config.parse"
    :editor-custom-type="config.mFormItemType"
    @save="save"
  ></MagicCodeEditor>
</template>

<script lang="ts" setup>
import type { CodeConfig, FieldProps } from '@tmagic/form';

import MagicCodeEditor from '@editor/layouts/CodeEditor.vue';

defineOptions({
  name: 'MFieldsVsCode',
});

const emit = defineEmits<{
  change: [value: string | any];
}>();

withDefaults(defineProps<FieldProps<CodeConfig>>(), {
  disabled: false,
});

const save = (v: string | any) => {
  emit('change', v);
};
</script>
