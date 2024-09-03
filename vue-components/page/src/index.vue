<template>
  <component :is="containerComponent" class="magic-ui-page" :data-tmagic-id="config.id" :config="config"></component>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue-demi';

import type { MPage } from '@tmagic/schema';
import { useApp, useComponent } from '@tmagic/vue-runtime-help';

export default defineComponent({
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

    const { app } = useApp({
      config: props.config,
      methods: { refresh },
    });

    const containerComponent = useComponent({ componentType: 'container', app });

    return {
      containerComponent,
    };
  },
});
</script>
