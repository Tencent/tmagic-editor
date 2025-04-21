<template>
  <div @click="clickHandler">
    <IteratorItem
      v-for="(item, index) in configs"
      :key="index"
      :config="item"
      :iterator-index="[...(iteratorIndex || []), index]"
      :iterator-container-id="
        config.id ? [...(iteratorContainerId || []), config.id] : [...(iteratorContainerId || [])]
      "
    ></IteratorItem>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, type PropType, watch } from 'vue-demi';

import type TMagicApp from '@tmagic/core';
import {
  COMMON_EVENT_PREFIX,
  type Id,
  type IteratorContainer as TMagicIteratorContainer,
  type MIteratorContainer,
  type MNode,
} from '@tmagic/core';
import { registerNodeHooks, useNode } from '@tmagic/vue-runtime-help';

import IteratorItem from './IteratorItem.vue';

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
  name: 'tmagic-iterator-container',

  components: { IteratorItem },

  props: {
    config: {
      type: Object as PropType<IteratorContainerSchema>,
      required: true,
    },
    iteratorIndex: Array as PropType<number[]>,
    iteratorContainerId: Array as PropType<Id[]>,
    containerIndex: Number,
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    const app = inject<TMagicApp>('app');
    const node = useNode(props, app);
    registerNodeHooks(node);

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
            ? (app?.dataSourceManager?.compliedIteratorItemConds(itemData, itemConfig, dsField) ?? true)
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

    const clickHandler = () => {
      if (app && node) {
        app.emit(`${COMMON_EVENT_PREFIX}click`, node);
      }
    };

    return {
      configs,
      clickHandler,
    };
  },
});
</script>
