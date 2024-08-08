<template>
  <button class="magic-ui-button">
    <slot>
      <p>{{ config?.text || '' }}</p>
    </slot>
  </button>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue-demi';

import type { MComponent } from '@tmagic/schema';
import { useApp } from '@tmagic/vue-runtime-help';

interface ButtonSchema extends MComponent {
  type: 'button';
  text: string;
}

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<ButtonSchema>,
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
