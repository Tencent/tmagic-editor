<template>
  <magic-ui-page v-if="pageConfig" :config="pageConfig" :key="pageConfig.id"></magic-ui-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { useEditorDsl } from '@tmagic/vue-runtime-help';
declare global {
  interface Window {
    magic: Magic;
    appInstance: Core;
  }
}

export default defineComponent({
  setup() {
    const { pageConfig } = useEditorDsl();

    return {
      pageConfig,
    };
  },
});
</script>

<style lang="scss">
::-webkit-scrollbar {
  width: 0;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
}

#app {
  position: relative;
  overflow: auto;
}

.magic-ui-container {
  background-color: rgba(136, 136, 136, 0.5);
}

.action-area {
  background-color: rgba(51, 153, 255, 0.5) !important;
}
</style>
