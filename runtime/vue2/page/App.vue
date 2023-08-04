<template>
  <magic-ui-page :config="pageConfig"></magic-ui-page>
</template>

<script lang="ts">
import { defineComponent, inject, reactive } from 'vue';

import Core from '@tmagic/core';
import { MNode } from '@tmagic/schema';
import { replaceChildNode } from '@tmagic/utils';

export default defineComponent({
  name: 'App',

  setup() {
    const app = inject<Core | undefined>('app');
    const pageConfig = reactive(app?.page?.data || {});

    app?.dataSourceManager?.on('update-data', (nodes: MNode[]) => {
      nodes.forEach((node) => {
        replaceChildNode(reactive(node), [pageConfig as MNode]);
      });
    });

    return {
      pageConfig,
    };
  },
});
</script>
