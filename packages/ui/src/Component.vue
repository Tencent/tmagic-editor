<template>
  <component
    v-if="display()"
    :is="tagName"
    :id="config.id"
    :class="`magic-ui-component${config.className ? ` ${config.className}` : ''}`"
    :style="style"
    :config="config"
  ></component>
</template>

<script lang="ts">
import { computed, defineComponent, getCurrentInstance, inject, provide } from 'vue';

import Core from '@tmagic/core';
import { toLine } from '@tmagic/utils';

export default defineComponent({
  props: {
    config: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    const vm = getCurrentInstance()?.proxy;
    const app: Core | undefined = inject('app');

    provide('hoc', vm);

    return {
      tagName: computed(() => `magic-ui-${toLine(props.config.type)}`),
      style: computed(() => app?.transformStyle(props.config.style)),

      display: () => {
        const displayCfg = props.config?.display;

        if (typeof displayCfg === 'function') {
          return displayCfg(app);
        }
        return displayCfg !== false;
      },
    };
  },
});
</script>
