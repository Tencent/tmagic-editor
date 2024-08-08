<template>
  <TMagicContainer v-if="visible" class="magic-ui-overlay" :config="{ items: config.items }">
    <slot></slot>
  </TMagicContainer>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, type PropType, ref } from 'vue-demi';

import type { MContainer, MNode, MPage } from '@tmagic/schema';
import TMagicContainer from '@tmagic/vue-container';
import { useApp } from '@tmagic/vue-runtime-help';

interface OverlaySchema extends MContainer {
  type: 'overlay';
}

export default defineComponent({
  components: {
    TMagicContainer,
  },

  props: {
    config: {
      type: Object as PropType<OverlaySchema>,
      required: true,
    },
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
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

    const editorSelectHandler = (
      info: {
        node: MNode;
        page: MPage;
        parent: MContainer;
      },
      path: MNode[],
    ) => {
      if (path.find((node: MNode) => node.id === props.config.id)) {
        node?.instance.openOverlay();
      } else {
        node?.instance.closeOverlay();
      }
    };

    app?.page?.on('editor:select', editorSelectHandler);

    onBeforeUnmount(() => {
      app?.page?.off('editor:select', editorSelectHandler);
    });

    return {
      visible,
    };
  },
});
</script>
