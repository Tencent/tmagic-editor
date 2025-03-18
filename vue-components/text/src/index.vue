<template>
  <p @click="clickHandler" v-html="config.text"></p>
</template>

<script lang="ts">
import { defineComponent, inject, type PropType } from 'vue-demi';

import type TMagicApp from '@tmagic/core';
import { COMMON_EVENT_PREFIX, type Id, type MComponent } from '@tmagic/core';
import { registerNodeHooks, useNode } from '@tmagic/vue-runtime-help';

interface TextSchema extends Omit<MComponent, 'id'> {
  id?: Id;
  type?: 'text';
  text: string;
}

export default defineComponent({
  name: 'tmagic-text',

  props: {
    config: {
      type: Object as PropType<TextSchema>,
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
    const node = useNode(props);
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
