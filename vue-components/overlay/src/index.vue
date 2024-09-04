<template>
  <component v-if="visible" :is="containerComponent" :config="{ items: config.items }">
    <slot></slot>
  </component>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, type PropType, ref } from 'vue-demi';

import type { Id, MContainer, MNode, MPage } from '@tmagic/core';
import { useApp, useComponent } from '@tmagic/vue-runtime-help';

interface OverlaySchema extends Omit<MContainer, 'id'> {
  id?: Id;
  type?: 'overlay';
}

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<OverlaySchema>,
      required: true,
    },
    iteratorIndex: Array as PropType<number[]>,
    iteratorContainerId: Array as PropType<Id[]>,
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    const visible = ref(false);

    const { app, node } = useApp({
      config: props.config,
      iteratorContainerId: props.iteratorContainerId,
      iteratorIndex: props.iteratorIndex,
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

    const containerComponent = useComponent({ componentType: 'container', app });

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
      containerComponent,
      visible,
    };
  },
});
</script>
