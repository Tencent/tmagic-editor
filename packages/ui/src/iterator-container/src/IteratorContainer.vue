<template>
  <div
    class="magic-ui-iterator-container"
    :data-iterator-index="dataIteratorIndex"
    :data-iterator-container-id="dataIteratorContainerId"
  >
    <Container
      v-for="(item, index) in configs"
      :iterator-index="[...(dataIteratorIndex || []), index]"
      :iterator-container-id="[...(dataIteratorContainerId || []), config.id]"
      :key="index"
      :config="item"
    ></Container>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';

import type { IteratorContainer as TMagicIteratorContainer } from '@tmagic/core';
import { type Id, type MIteratorContainer, NodeType } from '@tmagic/schema';
import { useApp } from '@tmagic/vue-runtime-help';

import Container from '../../container';

const props = withDefaults(
  defineProps<{
    config: MIteratorContainer;
    model?: any;
    dataIteratorIndex?: number[];
    dataIteratorContainerId?: Id[];
  }>(),
  {
    model: () => ({}),
  },
);

const { app } = useApp({
  config: props.config,
  iteratorContainerId: props.dataIteratorContainerId,
  iteratorIndex: props.dataIteratorIndex,
  methods: {},
});

const configs = computed(() => {
  let { iteratorData = [] } = props.config;
  const { id, itemConfig, dsField, items } = props.config;

  if (!Array.isArray(iteratorData)) {
    iteratorData = [];
  }

  if (app?.platform === 'editor' && !iteratorData.length) {
    iteratorData.push({});
  }

  return iteratorData.map((itemData) => {
    const condResult =
      app?.platform !== 'editor'
        ? app?.dataSourceManager?.compliedIteratorItemConds(itemData, itemConfig, dsField) ?? true
        : true;

    const newItems =
      app?.dataSourceManager?.compliedIteratorItems(
        id,
        itemData,
        items,
        dsField,
        props.dataIteratorContainerId,
        props.dataIteratorIndex,
      ) ?? items;

    return {
      items: newItems,
      id: '',
      type: NodeType.CONTAINER,
      condResult,
      style: {
        ...itemConfig.style,
        position: 'relative',
        left: 0,
        top: 0,
      },
    };
  });
});

watch(
  configs,
  (configs) => {
    const iteratorContainerNode = app?.getNode<TMagicIteratorContainer>(
      props.config.id,
      props.dataIteratorContainerId,
      props.dataIteratorIndex,
    );

    if (!iteratorContainerNode) {
      return;
    }

    iteratorContainerNode.resetNodes();

    configs.forEach((config, index) => {
      iteratorContainerNode.setNodes(config.items, index);
    });
  },
  {
    immediate: true,
  },
);
</script>
