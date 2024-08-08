<template>
  <TMagicContainer class="magic-ui-page-fragment" :config="config"></TMagicContainer>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue-demi';

import type { MPageFragment } from '@tmagic/schema';
import TMagicContainer from '@tmagic/vue-container';
import { useApp } from '@tmagic/vue-runtime-help';

export default defineComponent({
  components: {
    TMagicContainer,
  },

  props: {
    config: {
      type: Object as PropType<MPageFragment>,
      required: true,
    },
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    useApp({
      config: props.config,
      methods: {},
    });
  },
});
</script>
