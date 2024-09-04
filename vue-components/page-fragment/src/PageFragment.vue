<template>
  <component
    :is="containerComponent"
    class="magic-ui-page-fragment"
    :data-tmagic-id="config.id"
    :config="config"
    :style="app?.transformStyle(config.style || {})"
  ></component>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue-demi';

import type { MPageFragment } from '@tmagic/core';
import { useApp, useComponent } from '@tmagic/vue-runtime-help';

export default defineComponent({
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
    const { app } = useApp({
      config: props.config,
      methods: {},
    });

    const containerComponent = useComponent({ componentType: 'container', app });

    return {
      app,
      containerComponent,
    };
  },
});
</script>
