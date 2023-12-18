<template>
  <div
    :id="`${config.id || ''}`"
    :class="`magic-ui-page-fragment magic-ui-container magic-layout-${config.layout}${
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

import type { MPageFragment } from '@tmagic/schema';

import MComponent from '../../Component.vue';
import useApp from '../../useApp';

export default defineComponent({
  components: {
    'magic-ui-component': MComponent,
  },

  props: {
    config: {
      type: Object as PropType<MPageFragment>,
      default: () => ({}),
    },
  },

  setup(props) {
    const app = useApp(props);

    return {
      style: computed(() => app?.transformStyle(props.config.style || {})),
    };
  },
});
</script>
