<template>
  <magic-ui-container v-if="visible" class="magic-ui-overlay" :config="{ items: config.items }">
    <slot></slot>
  </magic-ui-container>
</template>
<script lang="ts">
import { defineComponent, onBeforeUnmount, ref } from 'vue';

import Core from '@tmagic/core';
import type { MContainer, MNode, MPage } from '@tmagic/schema';

import useApp from '../../useApp';

export default defineComponent({
  props: {
    config: {
      type: Object,
      default: () => ({}),
    },

    model: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    const visible = ref(false);
    const app: Core | undefined = useApp(props);
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

    const editorSelectHandler = (
      info: {
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

    onBeforeUnmount(() => {
      app?.page?.off('editor:select', editorSelectHandler);
    });

    return {
      visible,

      openOverlay,
      closeOverlay,
    };
  },
});
</script>
