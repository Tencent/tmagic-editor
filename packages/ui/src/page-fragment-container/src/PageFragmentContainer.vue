<template>
  <div :id="`${config.id || ''}`" class="magic-ui-page-fragment-container">
    <Container :config="containerConfig" :model="model"></Container>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { type MComponent, type MNode, NodeType } from '@tmagic/schema';
import { useApp } from '@tmagic/vue-runtime-help';

import Container from '../../container';

const props = withDefaults(
  defineProps<{
    config: MComponent;
    model?: any;
  }>(),
  {
    model: () => ({}),
  },
);

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
</script>

<style scoped>
.in-editor .magic-ui-page-fragment-container {
  min-width: 100px;
  min-height: 100px;
}
</style>
