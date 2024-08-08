<template>
  <img class="magic-ui-img" :src="config.src" @click="clickHandler" />
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue-demi';

import type { MComponent } from '@tmagic/schema';
import { useApp } from '@tmagic/vue-runtime-help';

interface ImgSchema extends MComponent {
  type: 'img';
  src: string;
  url: string;
}

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<ImgSchema>,
      required: true,
    },
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
      methods: {},
    });

    return {
      clickHandler,
    };
  },
});
</script>
