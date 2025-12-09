<template>
  <component v-if="visible" :is="containerComponent" :config="{ items: config.items, [IS_DSL_NODE_KEY]: false }">
    <slot></slot>
  </component>
</template>

<script lang="ts" setup>
import { inject, onBeforeUnmount, ref } from 'vue';

import type TMagicApp from '@tmagic/core';
import { type Id, IS_DSL_NODE_KEY, type MContainer, type MNode, type MPage } from '@tmagic/core';
import { type ComponentProps, registerNodeHooks, useComponent, useNode } from '@tmagic/vue-runtime-help';

interface OverlaySchema extends Omit<MContainer, 'id'> {
  id?: Id;
  type?: 'overlay';
}

defineOptions({
  name: 'tmagic-overlay',
});

const props = defineProps<ComponentProps<OverlaySchema>>();

const visible = ref(false);

const app = inject<TMagicApp>('app');
const containerComponent = useComponent({ componentType: 'container', app });

const openOverlay = () => {
  visible.value = true;
  app?.emit('overlay:open', node);
};

const closeOverlay = () => {
  visible.value = false;
  app?.emit('overlay:close', node);
};

const editorSelectHandler = (
  _info: {
    node: MNode;
    page: MPage;
    parent: MContainer;
  },
  path: MNode[],
) => {
  if (path.find((node: MNode) => node.id === props.config.id)) {
    openOverlay();
  } else {
    closeOverlay();
  }
};

app?.page?.on('editor:select', editorSelectHandler);

app?.on('page-change', () => {
  app?.page?.on('editor:select', editorSelectHandler);
});

onBeforeUnmount(() => {
  app?.page?.off('editor:select', editorSelectHandler);
});

const node = useNode(props, app);
registerNodeHooks(node, {
  openOverlay,
  closeOverlay,
});

defineExpose({
  openOverlay,
  closeOverlay,
});
</script>
