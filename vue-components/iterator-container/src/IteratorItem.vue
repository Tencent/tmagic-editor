<template>
  <component
    :is="containerComponent"
    :style="style"
    :class="className"
    :config="config"
    :iterator-index="iteratorIndex"
    :iterator-container-id="iteratorContainerId"
  ></component>
</template>

<script lang="ts">
import { defineComponent, inject, type PropType } from 'vue-demi';

import type TMagicApp from '@tmagic/core';
import type { Id } from '@tmagic/core';
import { useComponent, useComponentStatus } from '@tmagic/vue-runtime-help';

import { IteratorItemSchema } from './type';

export default defineComponent({
  name: 'tmagic-iterator-container-item',

  props: {
    config: {
      type: Object as PropType<IteratorItemSchema>,
      required: true,
    },
    iteratorIndex: Array as PropType<number[]>,
    iteratorContainerId: Array as PropType<Id[]>,
    containerIndex: Number,
    index: Number,
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    const app = inject<TMagicApp>('app');

    const containerComponent = useComponent({ componentType: 'container', app });

    const { style, className } = useComponentStatus(props);

    return {
      style,
      className,
      containerComponent,
    };
  },
});
</script>
