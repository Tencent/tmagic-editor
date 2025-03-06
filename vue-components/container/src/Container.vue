<template>
  <div @click="clickHandler">
    <slot>
      <template v-for="(item, index) in config.items" :key="item.id">
        <ItemComponent
          :config="item"
          :index="index"
          :iterator-index="iteratorIndex"
          :iterator-container-id="iteratorContainerId"
        ></ItemComponent>
      </template>
    </slot>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, type PropType } from 'vue-demi';

import type TMagicApp from '@tmagic/core';
import { COMMON_EVENT_PREFIX, type Id, type MContainer } from '@tmagic/core';
import { registerNodeHooks, useNode } from '@tmagic/vue-runtime-help';

import ItemComponent from './Component';

interface ContainerSchema extends Omit<MContainer, 'id'> {
  id?: Id;
  type?: 'container';
}

export default defineComponent({
  name: 'tmagic-container',

  props: {
    config: {
      type: Object as PropType<ContainerSchema>,
      required: true,
    },
    iteratorIndex: {
      type: Array as PropType<number[]>,
      default: () => [],
    },
    iteratorContainerId: {
      type: Array as PropType<Id[]>,
      default: () => [],
    },
    containerIndex: Number,
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  components: { ItemComponent },

  setup(props) {
    const app = inject<TMagicApp>('app');
    const node = useNode(props, app);
    registerNodeHooks(node);

    const clickHandler = () => {
      if (app && node) {
        app.emit(`${COMMON_EVENT_PREFIX}click`, node);
      }
    };

    return {
      clickHandler,
    };
  },
});
</script>
