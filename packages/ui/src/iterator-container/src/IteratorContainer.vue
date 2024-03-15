<template>
  <div class="magic-ui-iterator-container" :id="`${config.id || ''}`" :style="style">
    <Container v-for="(item, index) in configs" :key="index" :config="item"></Container>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';

import Core from '@tmagic/core';
import type { MContainer } from '@tmagic/schema';

import Container from '../../container';
import useApp from '../../useApp';

const props = withDefaults(
  defineProps<{
    config: MContainer & {
      type: 'iterator-container';
      iteratorData: any[];
      dsField: string[];
      itemConfig: {
        layout: string;
        style: Record<string, string | number>;
      };
    };
    model?: any;
  }>(),
  {
    model: () => ({}),
  },
);

const app: Core | undefined = inject('app');

const style = computed(() => app?.transformStyle(props.config.style || {}));

const configs = computed(() => {
  const { iteratorData = [] } = props.config;

  if (app?.platform === 'editor' && !iteratorData.length) {
    iteratorData.push({});
  }

  return iteratorData.map((itemData) => ({
    items:
      app?.dataSourceManager?.compliedIteratorItems(itemData, props.config.items, props.config.dsField) ??
      props.config.items,
    id: '',
    style: {
      ...props.config.itemConfig.style,
      position: 'relative',
      left: 0,
      top: 0,
    },
  }));
});

useApp({
  config: props.config,
  methods: {},
});
</script>
