<template>
  <component v-if="pageConfig" :is="pageComponent" :key="pageConfig.id" :config="pageConfig"></component>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { useComponent, useEditorDsl } from '@tmagic/vue-runtime-help';

export default defineComponent({
  setup() {
    const { pageConfig } = useEditorDsl();
    const pageComponent = useComponent('page');

    return {
      pageComponent,
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
