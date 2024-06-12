<template>
  <magic-ui-page v-if="pageConfig" :key="pageConfig.id" :config="pageConfig"></magic-ui-page>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';

import type Core from '@tmagic/core';
import { useEditorDsl } from '@tmagic/vue-runtime-help';

export default defineComponent({
  setup() {
    const app = inject<Core | undefined>('app');
    const { pageConfig } = useEditorDsl(app);

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
