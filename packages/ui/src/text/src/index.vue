<template>
  <p>{{ config.text }}</p>
</template>

<script lang="ts" setup>
import type { MComponent } from '@tmagic/schema';
import { useApp } from '@tmagic/vue-runtime-help';

const props = withDefaults(
  defineProps<{
    config: MComponent & { type: 'text'; text: string };
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
