<template>
  <magic-code-editor
    :style="`height: ${height}`"
    :init-values="model[name]"
    :language="language"
    @save="save"
  ></magic-code-editor>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';

export default defineComponent({
  name: 'm-fields-vs-code',

  props: ['model', 'name', 'config', 'prop'],

  emits: ['change'],

  setup(props, { emit }) {
    const language = computed(() => props.config.language || 'javascript');
    const height = computed(() => `${document.body.clientHeight - 168}px`);

    return {
      height,
      language,

      save(v: string) {
        props.model[props.name] = v;
        emit('change', v);
      },
    };
  },
});
</script>
