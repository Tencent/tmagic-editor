<template>
  <div>
    <component
      :is="containerComponent"
      v-for="(item, index) in configs"
      :iterator-index="[...(iteratorIndex || []), index]"
      :iterator-container-id="[...(iteratorContainerId || []), config.id]"
      :key="index"
      :config="item"
    ></component>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType, watch } from 'vue-demi';

import type { Id, IteratorContainer as TMagicIteratorContainer, MIteratorContainer, MNode } from '@tmagic/core';
import { useApp, useComponent } from '@tmagic/vue-runtime-help';

interface IteratorContainerSchema extends Omit<MIteratorContainer, 'id'> {
  id?: Id;
  type?: 'iterator-container';
}

interface IteratorItemSchema {
  items: MNode[];
  condResult: boolean;
  style: {
    [key: string]: any;
  };
}

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<IteratorContainerSchema>,
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
      iteratorContainerId: props.iteratorContainerId,
      iteratorIndex: props.iteratorIndex,
      methods: {},
    });

    const containerComponent = useComponent({ componentType: 'container', app });

    const configs = computed<IteratorItemSchema[]>(() => {
      let { iteratorData = [] } = props.config;
      const { itemConfig, dsField, items } = props.config;

      if (!Array.isArray(iteratorData)) {
        iteratorData = [];
      }

      if (app?.platform === 'editor' && !iteratorData.length) {
        iteratorData.push({});
      }

      return iteratorData.map((itemData: any) => {
        const condResult =
          app?.platform !== 'editor'
            ? app?.dataSourceManager?.compliedIteratorItemConds(itemData, itemConfig, dsField) ?? true
            : true;

        const newItems = app?.dataSourceManager?.compliedIteratorItems(itemData, items, dsField) ?? items;

        return {
          items: newItems,
          condResult,
          style: {
            position: 'relative',
            left: 0,
            top: 0,
            ...itemConfig.style,
          },
        };
      });
    });

    watch(
      configs,
      (configs) => {
        if (!props.config.id) {
          return;
        }

        const iteratorContainerNode = app?.getNode<TMagicIteratorContainer>(
          props.config.id,
          props.iteratorContainerId,
          props.iteratorIndex,
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
      containerComponent,
    };
  },
});
</script>
