<template>
  <img :src="config.src" @click="clickHandler" />
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue-demi';

import type { Id, MComponent } from '@tmagic/core';
import { registerNodeHooks, useNode } from '@tmagic/vue-runtime-help';

interface ImgSchema extends Omit<MComponent, 'id'> {
  id?: Id;
  type?: 'img';
  src: string;
  url?: string;
}

export default defineComponent({
  name: 'tmagic-img',

  props: {
    config: {
      type: Object as PropType<ImgSchema>,
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
    const clickHandler = () => {
      if (props.config.url) window.location.href = props.config.url;
    };

    const node = useNode(props);
    registerNodeHooks(node);

    return {
      clickHandler,
    };
  },
});
</script>
