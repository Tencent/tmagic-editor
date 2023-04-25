<template>
  <magic-ui-container v-if="visible" class="magic-ui-overlay" :config="{ items: config.items }">
    <slot></slot>
  </magic-ui-container>
</template>
<script lang="ts" setup>
import { inject, ref } from 'vue';

import Core from '@tmagic/core';
import type { MComponent, MNode } from '@tmagic/schema';

import useApp from '../../useApp';

const props = withDefaults(
  defineProps<{
    config: MComponent;
    model?: any;
  }>(),
  {
    model: () => ({}),
  },
);

const visible = ref(false);
const app: Core | undefined = inject('app');
const node = app?.page?.getNode(props.config.id);

const openOverlay = () => {
  visible.value = true;
  if (app) {
    app.emit('overlay:open', node);
  }
};

const closeOverlay = () => {
  visible.value = false;
  if (app) {
    app.emit('overlay:close', node);
  }
};

app?.page?.on('editor:select', (info, path) => {
  if (path.find((node: MNode) => node.id === props.config.id)) {
    openOverlay();
  } else {
    closeOverlay();
  }
});

useApp({
  config: props.config,
  methods: {
    openOverlay,
    closeOverlay,
  },
});
</script>
