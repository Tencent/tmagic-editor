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
import { computed } from 'vue';

import { type Id, type MIteratorContainer, NodeType, TMagicIteratorContainer } from '@tmagic/schema';
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

const { app, node } = useApp({
  config: props.config,
  iteratorContainerId: props.dataIteratorContainerId,
  iteratorIndex: props.dataIteratorIndex,
  methods: {},
});

const iteratorContainerNode = node as unknown as TMagicIteratorContainer;

const configs = computed(() => {
  let { iteratorData = [] } = props.config;
  const { id, itemConfig, dsField, items } = props.config;

  if (!Array.isArray(iteratorData)) {
    iteratorData = [];
  }

  if (app?.platform === 'editor' && !iteratorData.length) {
    iteratorData.push({});
  }

  iteratorContainerNode?.resetNodes();

  return iteratorData.map((itemData, index) => {
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

    iteratorContainerNode?.setNodes(newItems, index);

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
</script>
