<template>
  <div :id="`${config.id || ''}`" class="magic-ui-page-fragment-container">
    <TMagicContainer :config="containerConfig" :model="model"></TMagicContainer>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from 'vue-demi';

import { type MComponent, type MNode, NodeType } from '@tmagic/schema';
import TMagicContainer from '@tmagic/vue-container';
import { useApp } from '@tmagic/vue-runtime-help';

export default defineComponent({
  components: {
    TMagicContainer,
  },

  props: {
    config: {
      type: Object as PropType<MComponent>,
      required: true,
    },
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    const { app } = useApp({
      config: props.config,
      methods: {},
    });

    const fragment = computed(() => app?.dsl?.items?.find((page) => page.id === props.config.pageFragmentId));

    const containerConfig = computed(() => {
      if (!fragment.value) return { items: [], id: '', type: NodeType.CONTAINER };

      const { id, type, items, ...others } = fragment.value;
      const itemsWithoutId = items.map((item: MNode) => {
        const { id, ...otherConfig } = item;
        return {
          id: '',
          ...otherConfig,
        };
      });

      if (app?.platform === 'editor') {
        return {
          ...others,
          items: itemsWithoutId,
          id: '',
          type: NodeType.CONTAINER,
        };
      }

      return {
        ...others,
        items,
        id: '',
        type: NodeType.CONTAINER,
      };
    });

    return {
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
