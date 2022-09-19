<template>
  <magic-code-editor
    :style="`height: ${height}`"
    :init-values="model[name]"
    :language="language"
    @save="save"
  ></magic-code-editor>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const emit = defineEmits(['change']);

const props = defineProps<{
  model: any;
  name: string;
  config: {
    language?: string;
  };
  prop: string;
}>();

const language = computed(() => props.config.language || 'javascript');
const height = computed(() => `${document.body.clientHeight - 168}px`);

const save = (v: string) => {
  props.model[props.name] = v;
  emit('change', v);
};
</script>
