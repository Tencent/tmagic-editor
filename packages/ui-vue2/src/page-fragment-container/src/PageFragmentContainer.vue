<template>
  <div :id="`${config.id || ''}`" class="magic-ui-page-fragment-container">
    <magic-ui-container :config="containerConfig" :model="model"></magic-ui-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';

import { MComponent, MNode } from '@tmagic/schema';

import Container from '../../container';
import useApp from '../../useApp';

export default defineComponent({
  components: {
    'magic-ui-container': Container,
  },

  props: {
    config: {
      type: Object as PropType<MComponent>,
      default: () => ({}),
    },
  },

  setup(props) {
    const app = useApp(props);
    const fragment = computed(() => app?.dsl?.items?.find((page) => page.id === props.config.pageFragmentId));
    const containerConfig = computed(() => {
      if (!fragment.value) return { items: [] };
      const { id, type, items, ...others } = fragment.value;
      const itemsWithoutId = items.map((item: MNode) => {
        const { id, ...otherConfig } = item;
        return otherConfig;
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
