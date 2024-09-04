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
import { computed, defineComponent, type PropType } from 'vue-demi';

import { type Id, type MComponent, type MNode, NodeType } from '@tmagic/core';
import { useApp, useComponent } from '@tmagic/vue-runtime-help';

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<MComponent>,
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
    const { app } = useApp({
      config: props.config,
      methods: {},
      iteratorContainerId: props.iteratorContainerId,
      iteratorIndex: props.iteratorIndex,
    });

    const containerComponent = useComponent({ componentType: 'container', app });

    const fragment = computed(() => app?.dsl?.items?.find((page) => page.id === props.config.pageFragmentId));

    const containerConfig = computed(() => {
      if (!fragment.value) return { items: [], id: '', type: NodeType.CONTAINER };

      const { id, type, items, ...others } = fragment.value;
      const itemsWithoutId = items.map((item: MNode) => {
        const { id, ...otherConfig } = item;
        return {
          ...otherConfig,
        };
      });

      if (app?.platform === 'editor') {
        return {
          ...others,
          items: itemsWithoutId,
        };
      }

      return {
        ...others,
        items,
      };
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
