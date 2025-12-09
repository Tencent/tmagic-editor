<template>
  <button @click="clickHandler">
    <slot>
      {{ config?.text || '' }}
    </slot>
  </button>
</template>

<script lang="ts" setup>
import { COMMON_EVENT_PREFIX, type Id, type MComponent } from '@tmagic/core';
import { type ComponentProps, useApp } from '@tmagic/vue-runtime-help';

interface ButtonSchema extends Omit<MComponent, 'id'> {
  id?: Id;
  type?: 'button';
  text: string;
}

defineOptions({
  name: 'tmagic-button',
});

const props = defineProps<ComponentProps<ButtonSchema>>();

const { app, node } = useApp(props);
const clickHandler = () => {
  if (app && node) {
    app.emit(`${COMMON_EVENT_PREFIX}click`, node);
  }
};
</script>
