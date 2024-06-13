<template>
  <button class="magic-ui-button">
    <slot>
      <p>{{ config?.text || '' }}</p>
    </slot>
  </button>
</template>

<script lang="ts" setup>
import type { MComponent } from '@tmagic/schema';
import { useApp } from '@tmagic/vue-runtime-help';

interface ButtonSchema extends MComponent {
  type: 'button';
  text: string;
}

const props = withDefaults(
  defineProps<{
    config: ButtonSchema;
    model?: any;
  }>(),
  {
    model: () => ({}),
  },
);

useApp({
  config: props.config,
  methods: {},
});
</script>
