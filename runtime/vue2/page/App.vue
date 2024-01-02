<template>
  <magic-ui-page :config="pageConfig"></magic-ui-page>
</template>

<script lang="ts">
import { defineComponent, inject, nextTick, reactive } from 'vue';

import Core from '@tmagic/core';
import type { ChangeEvent } from '@tmagic/data-source';
import type { MNode } from '@tmagic/schema';
import { replaceChildNode } from '@tmagic/utils';

export default defineComponent({
  name: 'App',

  setup() {
    const app = inject<Core | undefined>('app');
    const pageConfig = reactive(app?.page?.data || {});

    app?.dataSourceManager?.on('update-data', (nodes: MNode[], sourceId: string, changeEvent: ChangeEvent) => {
      nodes.forEach((node) => {
        replaceChildNode(reactive(node), [pageConfig as MNode]);
      });

      if (!app) return;

      nextTick(() => {
        app.emit('replaced-node', { nodes, sourceId, ...changeEvent });
      });
    });

    return {
      pageConfig,
    };
  },
});
</script>
