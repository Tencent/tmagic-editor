<template>
  <magic-ui-container class="magic-ui-page" :config="config">
    <slot></slot>
  </magic-ui-container>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';

import { MPage } from '@tmagic/schema';

import useApp from '../useApp';

export default defineComponent({
  name: 'magic-ui-page',

  props: {
    config: {
      type: Object as PropType<MPage>,
      default: () => ({}),
    },
  },

  setup(props) {
    if (props.config) {
      useApp(props);
    }
  },
});
</script>
