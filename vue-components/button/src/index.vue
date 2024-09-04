<template>
  <button>
    <slot>
      {{ config?.text || '' }}
    </slot>
  </button>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue-demi';

import type { Id, MComponent } from '@tmagic/core';
import { useApp } from '@tmagic/vue-runtime-help';

interface ButtonSchema extends Omit<MComponent, 'id'> {
  id?: Id;
  type?: 'button';
  text: string;
}

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<ButtonSchema>,
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
    useApp({
      config: props.config,
      methods: {},
      iteratorContainerId: props.iteratorContainerId,
      iteratorIndex: props.iteratorIndex,
    });
  },
});
</script>
