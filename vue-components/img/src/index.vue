<template>
  <img :src="config.src" @click="clickHandler" />
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue-demi';

import type { Id, MComponent } from '@tmagic/core';
import { useApp } from '@tmagic/vue-runtime-help';

interface ImgSchema extends Omit<MComponent, 'id'> {
  id?: Id;
  type?: 'img';
  src: string;
  url?: string;
}

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<ImgSchema>,
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
    const clickHandler = () => {
      if (props.config.url) window.location.href = props.config.url;
    };

    useApp({
      config: props.config,
      iteratorContainerId: props.iteratorContainerId,
      iteratorIndex: props.iteratorIndex,
      methods: {},
    });

    return {
      clickHandler,
    };
  },
});
</script>
