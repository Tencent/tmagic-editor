<template>
  <magic-ui-container v-if="visible" class="magic-ui-overlay" :config="{ items: config.items }">
    <slot></slot>
  </magic-ui-container>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue';

import Core from '@tmagic/core';
import type { MNode } from '@tmagic/schema';

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

    app?.page?.on('editor:select', (info, path) => {
      if (path.find((node: MNode) => node.id === props.config.id)) {
        openOverlay();
      } else {
        closeOverlay();
      }
    });

    return {
      visible,

      openOverlay,
      closeOverlay,
    };
  },
});
</script>
