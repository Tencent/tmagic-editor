<template>
  <button @click="clickHandler">
    <slot>
      {{ config?.text || '' }}
    </slot>
  </button>
</template>

<script lang="ts">
import { defineComponent, inject, type PropType } from 'vue-demi';

import { COMMON_EVENT_PREFIX, type Id, type MComponent } from '@tmagic/core';
import { useApp, useComponentStatus } from '@tmagic/vue-runtime-help';

interface ButtonSchema extends Omit<MComponent, 'id'> {
  id?: Id;
  type?: 'button';
  text: string;
}

export default defineComponent({
  name: 'tmagic-button',

  props: {
    config: {
      type: Object as PropType<ButtonSchema>,
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
    const { setStatus } = inject<ReturnType<typeof useComponentStatus>>('componentStatusStore')!;

    setStatus('disabled');

    const { app, node } = useApp(props);

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
