<template>
  <MagicCodeEditor
    :height="config.height"
    :init-values="model[name]"
    :language="config.language"
    :options="{
      ...config.options,
      readOnly: disabled,
    }"
    @save="save"
  ></MagicCodeEditor>
</template>

<script lang="ts" setup>
import type { FieldProps } from '@tmagic/form';

import MagicCodeEditor from '@editor/layouts/CodeEditor.vue';

defineOptions({
  name: 'MEditorCode',
});

const emit = defineEmits(['change']);

const props = withDefaults(
  defineProps<
    FieldProps<{
      language?: string;
      options?: Object;
      height?: string;
    }>
  >(),
  {
    disabled: false,
  },
);

const save = (v: string) => {
  props.model[props.name] = v;
  emit('change', v);
};
</script>
