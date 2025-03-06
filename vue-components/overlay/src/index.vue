<template>
  <component v-if="visible" :is="containerComponent" :config="{ items: config.items, [IS_DSL_NODE_KEY]: false }">
    <slot></slot>
  </component>
</template>

<script lang="ts">
import { defineComponent, inject, onBeforeUnmount, type PropType, ref } from 'vue-demi';

import type TMagicApp from '@tmagic/core';
import { type Id, IS_DSL_NODE_KEY, type MContainer, type MNode, type MPage } from '@tmagic/core';
import { registerNodeHooks, useComponent, useNode } from '@tmagic/vue-runtime-help';

interface OverlaySchema extends Omit<MContainer, 'id'> {
  id?: Id;
  type?: 'overlay';
}

export default defineComponent({
  name: 'tmagic-overlay',

  props: {
    config: {
      type: Object as PropType<OverlaySchema>,
      required: true,
    },
    iteratorIndex: Array as PropType<number[]>,
    iteratorContainerId: Array as PropType<Id[]>,
    containerIndex: Number,
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
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

    const node = useNode(props, app);
    registerNodeHooks(node, {
      openOverlay,
      closeOverlay,
    });

    return {
      containerComponent,
      visible,
      IS_DSL_NODE_KEY,
    };
  },
});
</script>
