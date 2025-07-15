<template>
  <div>
    <component
      :is="containerComponent"
      :iterator-index="iteratorIndex"
      :iterator-container-id="iteratorContainerId"
      :page-fragment-container-id="config.id"
      :config="containerConfig"
      :model="model"
    ></component>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType, provide } from 'vue-demi';

import {
  cloneDeep,
  type Id,
  IS_DSL_NODE_KEY,
  type MComponent,
  NodeType,
  PAGE_FRAGMENT_CONTAINER_ID_KEY,
  traverseNode,
} from '@tmagic/core';
import { registerNodeHooks, useApp, useComponent, useDsl } from '@tmagic/vue-runtime-help';

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
    pageFragmentContainerId: [String, Number] as PropType<Id>,
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    provide(PAGE_FRAGMENT_CONTAINER_ID_KEY, props.config.id);

    const { app, node } = useApp(props);
    registerNodeHooks(node);

    const containerComponent = useComponent({ componentType: 'container', app });

    const { pageConfig: fragment } = useDsl(app, props.config.id);

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
