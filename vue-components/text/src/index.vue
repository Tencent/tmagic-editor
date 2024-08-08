<template>
  <p>{{ config.text }}</p>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue-demi';

import type { MComponent } from '@tmagic/schema';
import { useApp } from '@tmagic/vue-runtime-help';

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<MComponent & { type: 'text'; text: string }>,
      required: true,
    },
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    useApp({
      config: props.config,
      methods: {},
    });
  },
});
</script>
