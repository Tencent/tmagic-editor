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
import MagicCodeEditor from '@editor/layouts/CodeEditor.vue';

defineOptions({
  name: 'MEditorCode',
});

const emit = defineEmits(['change']);

const props = withDefaults(
  defineProps<{
    config: {
      language?: string;
      options?: Object;
      height?: string;
    };
    model: any;
    name: string;
    prop: string;
    lastValues?: any;
    disabled?: boolean;
    size?: 'small' | 'default' | 'large';
  }>(),
  {
    disabled: false,
  },
);

const save = (v: string) => {
  props.model[props.name] = v;
  emit('change', v);
};
</script>
