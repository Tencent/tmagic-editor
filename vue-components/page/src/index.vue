<template>
  <TMagicContainer class="magic-ui-page" :config="config"></TMagicContainer>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue-demi';

import type { MPage } from '@tmagic/schema';
import TMagicContainer from '@tmagic/vue-container';
import { useApp } from '@tmagic/vue-runtime-help';

export default defineComponent({
  components: {
    TMagicContainer,
  },

  props: {
    config: {
      type: Object as PropType<MPage>,
      required: true,
    },
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    const refresh = () => {
      window.location.reload();
    };

    useApp({
      config: props.config,
      methods: { refresh },
    });
  },
});
</script>
