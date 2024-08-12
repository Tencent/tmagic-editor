<template>
  <div
    class="magic-ui-iterator-container"
    :data-iterator-index="dataTmagicIteratorIndex"
    :data-iterator-container-id="dataTmagicIteratorContainerId"
  >
    <TMagicContainer
      v-for="(item, index) in configs"
      :iterator-index="[...(dataTmagicIteratorIndex || []), index]"
      :iterator-container-id="[...(dataTmagicIteratorContainerId || []), config.id]"
      :key="index"
      :config="item"
    ></TMagicContainer>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType, watch } from 'vue-demi';

import type { IteratorContainer as TMagicIteratorContainer } from '@tmagic/core';
import { type Id, type MIteratorContainer, NodeType } from '@tmagic/schema';
import TMagicContainer from '@tmagic/vue-container';
import { useApp } from '@tmagic/vue-runtime-help';

export default defineComponent({
  components: {
    TMagicContainer,
  },

  props: {
    config: {
      type: Object as PropType<MIteratorContainer>,
      required: true,
    },
    dataTmagicIteratorIndex: Array as PropType<number[]>,
    dataTmagicIteratorContainerId: Array as PropType<Id[]>,
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    const { app } = useApp({
      config: props.config,
      iteratorContainerId: props.dataTmagicIteratorContainerId,
      iteratorIndex: props.dataTmagicIteratorIndex,
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
            props.dataTmagicIteratorContainerId,
            props.dataTmagicIteratorIndex,
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
          props.dataTmagicIteratorContainerId,
          props.dataTmagicIteratorIndex,
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

    return {
      configs,
    };
  },
});
</script>
