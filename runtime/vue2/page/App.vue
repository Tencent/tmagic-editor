<template>
  <component :is="pageComponent" :config="pageConfig"></component>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { useComponent, useDsl } from '@tmagic/vue-runtime-help';

export default defineComponent({
  name: 'App',

  setup() {
    const { pageConfig } = useDsl();
    const pageComponent = useComponent('page');

    return {
      pageComponent,
      pageConfig,
    };
  },
});
</script>
