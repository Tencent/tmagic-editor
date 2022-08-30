<template>
  <div
    :id="config.id"
    :class="`magic-ui-page magic-ui-container magic-layout-${config.layout}${
      config.className ? ` ${config.className}` : ''
    }`"
    :style="style"
  >
    <slot></slot>
    <magic-ui-component v-for="item in config.items" :key="item.id" :config="item"></magic-ui-component>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';

import type { MPage } from '@tmagic/schema';

import Component from '../Component.vue';
import useApp from '../useApp';

export default defineComponent({
  components: {
    'magic-ui-component': Component,
  },

  props: {
    config: {
      type: Object as PropType<MPage>,
      default: () => ({}),
    },
  },

  setup(props) {
    const app = useApp(props);

    return {
      style: computed(() => app?.transformStyle(props.config.style || {})),

      refresh() {
        window.location.reload();
      },
    };
  },
});
</script>
