<template>
  <MagicCodeEditor
    :height="config.height"
    :init-values="model[name]"
    :language="config.language"
    :options="{
      ...config.options,
      readOnly: disabled,
    }"
    :parse="config.parse"
    @save="save"
  ></MagicCodeEditor>
</template>

<script lang="ts" setup>
import type { FieldProps, FormItem } from '@tmagic/form';

import MagicCodeEditor from '@editor/layouts/CodeEditor.vue';

defineOptions({
  name: 'MFieldsVsCode',
});

const emit = defineEmits<{
  change: [value: string | any];
}>();

const props = withDefaults(
  defineProps<
    FieldProps<
      {
        language?: string;
        options?: {
          [key: string]: any;
        };
        height?: string;
        parse?: boolean;
      } & FormItem
    >
  >(),
  {
    disabled: false,
  },
);

const save = (v: string | any) => {
  props.model[props.name] = v;
  emit('change', v);
};
</script>
