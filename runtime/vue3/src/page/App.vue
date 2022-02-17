<template>
  <magic-ui-page :config="pageConfig"></magic-ui-page>
</template>

<script lang="ts">
import { defineComponent, inject, reactive } from 'vue';

import Core from '@tmagic/core';

export default defineComponent({
  name: 'App',

  setup() {
    const app = inject<Core | undefined>('app');
    const pageConfig = reactive(app?.page?.data || {});

    return {
      pageConfig,
    };
  },
});
</script>

<style lang="scss">
#app {
  width: fit-content;
  position: relative;
  margin: 0 auto;
}
::-webkit-scrollbar {
  width: 0;
}
</style>
