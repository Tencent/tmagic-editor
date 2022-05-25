<template>
  <img class="magic-ui-img" :src="config.src" @click="clickHandler" />
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { MImg } from '../../types';

export default defineComponent({
  name: 'magic-ui-img',
  props: {
    config: {
      type: Object as PropType<MImg>,
      default: () => ({}),
    },

    model: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    return {
      clickHandler() {
        window.location.href = props.config.url;
      },
    };
  },
});
</script>
