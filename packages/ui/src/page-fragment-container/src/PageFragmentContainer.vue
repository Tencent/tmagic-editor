<template>
  <div :id="`${config.id || ''}`" class="magic-ui-page-fragment-container">
    <Container :config="containerConfig" :model="model"></Container>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';

import Core from '@tmagic/core';
import { MComponent, MNode } from '@tmagic/schema';

import Container from '../../container';
import useApp from '../../useApp';

const props = withDefaults(
  defineProps<{
    config: MComponent;
    model?: any;
  }>(),
  {
    model: () => ({}),
  },
);

const app: Core | undefined = inject('app');
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

useApp({
  config: props.config,
  methods: {},
});
</script>
<style scoped>
.in-editor .magic-ui-page-fragment-container {
  min-width: 100px;
  min-height: 100px;
}
</style>
