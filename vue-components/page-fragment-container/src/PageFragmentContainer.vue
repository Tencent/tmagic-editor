<template>
  <div>
    <component
      :is="containerComponent"
      :iterator-index="iteratorIndex"
      :iterator-container-id="iteratorContainerId"
      :config="containerConfig"
      :model="model"
    ></component>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, type PropType } from 'vue-demi';

import type TMagicApp from '@tmagic/core';
import { cloneDeep, type Id, IS_DSL_NODE_KEY, type MComponent, NodeType, traverseNode } from '@tmagic/core';
import { registerNodeHooks, useComponent, useNode } from '@tmagic/vue-runtime-help';

export default defineComponent({
  name: 'tmagic-page-fragment-container',

  props: {
    config: {
      type: Object as PropType<MComponent>,
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
    const app = inject<TMagicApp>('app');
    const node = useNode(props, app);
    registerNodeHooks(node);

    const containerComponent = useComponent({ componentType: 'container', app });

    const fragment = computed(() => app?.dsl?.items?.find((page) => page.id === props.config.pageFragmentId));

    const containerConfig = computed(() => {
      if (!fragment.value) return { items: [], id: '', type: NodeType.CONTAINER };

      if (app?.platform === 'editor') {
        const fragmentConfigWithoutId = cloneDeep(fragment.value);
        traverseNode(fragmentConfigWithoutId, (node) => {
          node.id = '';
        });
        return { ...fragmentConfigWithoutId, [IS_DSL_NODE_KEY]: false };
      }

      return { ...fragment.value, [IS_DSL_NODE_KEY]: false };
    });

    return {
      containerComponent,
      containerConfig,
    };
  },
});
</script>

<style scoped>
.in-editor .magic-ui-page-fragment-container {
  min-width: 100px;
  min-height: 100px;
}
</style>
