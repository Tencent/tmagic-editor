<template>
  <MagicCodeEditor
    :height="height"
    :init-values="model[name]"
    :language="language"
    :options="{
      ...config.options,
      readOnly: disabled,
    }"
    @save="save"
  ></MagicCodeEditor>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

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

const language = computed(() => props.config.language || 'javascript');
const height = computed(() => props.config.height || `${document.body.clientHeight - 168}px`);

const save = (v: string) => {
  props.model[props.name] = v;
  emit('change', v);
};
</script>
