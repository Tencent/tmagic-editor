<template>
  <div
    v-if="display()"
    :id="config.id"
    :class="`magic-ui-container magic-layout-${config.layout}${config.className ? ` ${config.className}` : ''}`"
    :style="style"
  >
    <slot></slot>
    <magic-ui-component v-for="item in config.items" :key="item.id" :config="item"></magic-ui-component>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';

import type { MContainer } from '@tmagic/schema';

import Component from '../Component.vue';
import useApp from '../useApp';
import useCommonMethod from '../useCommonMethod';

export default defineComponent({
  components: {
    'magic-ui-component': Component,
  },

  props: {
    config: {
      type: Object as PropType<MContainer>,
      default: () => ({}),
    },
  },

  setup(props) {
    const app = useApp(props);

    return {
      style: computed(() => app?.transformStyle(props.config.style || {})),

      display: () => {
        const displayCfg = props.config?.display;

        if (typeof displayCfg === 'function') {
          return displayCfg(app);
        }
        return displayCfg !== false;
      },
      ...useCommonMethod(),
    };
  },
});
</script>
