<template>
  <magic-ui-container v-if="visible" class="magic-ui-overlay" :config="{ items: config.items }">
    <slot></slot>
  </magic-ui-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import type { MContainer, MNode } from '@tmagic/schema';

import useApp from '../../useApp';

interface OverlaySchema extends MContainer {
  type: 'overlay';
}

const props = withDefaults(
  defineProps<{
    config: OverlaySchema;
    model?: any;
  }>(),
  {
    model: () => ({}),
  },
);

const visible = ref(false);

const { app, node } = useApp({
  config: props.config,
  methods: {
    openOverlay() {
      visible.value = true;
      app?.emit('overlay:open', node);
    },
    closeOverlay() {
      visible.value = false;
      app?.emit('overlay:close', node);
    },
  },
});

app?.page?.on('editor:select', (info, path) => {
  if (path.find((node: MNode) => node.id === props.config.id)) {
    node?.instance.openOverlay();
  } else {
    node?.instance.closeOverlay();
  }
});
</script>
