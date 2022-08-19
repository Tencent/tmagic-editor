<template>
  <img class="magic-ui-img" :src="config.src" @click="clickHandler" />
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { MImg } from '../../types';
import useApp from '../../useApp';

export default defineComponent({
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
    useApp(props);

    return {
      clickHandler() {
        if (props.config.url) window.location.href = props.config.url;
      },
    };
  },
});
</script>
