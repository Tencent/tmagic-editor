<template>
  <magic-code-editor
    :style="`height: ${height}`"
    :init-values="model[name]"
    :language="language"
    :options="config.options"
    @save="save"
  ></magic-code-editor>
</template>

<script lang="ts" setup name="MEditorCode">
import { computed } from 'vue';

const emit = defineEmits(['change']);

const props = defineProps<{
  model: any;
  name: string;
  config: {
    language?: string;
    options?: Object;
    height?: string;
  };
  prop: string;
}>();

const language = computed(() => props.config.language || 'javascript');
const height = computed(() => props.config.height || `${document.body.clientHeight - 168}px`);

const save = (v: string) => {
  props.model[props.name] = v;
  emit('change', v);
};
</script>
