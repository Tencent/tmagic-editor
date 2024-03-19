<template>
  <magic-ui-page :config="pageConfig"></magic-ui-page>
</template>

<script lang="ts">
import { defineComponent, inject, nextTick, reactive, ref } from 'vue';

import type { Page } from '@tmagic/core';
import Core from '@tmagic/core';
import type { ChangeEvent } from '@tmagic/data-source';
import type { MNode } from '@tmagic/schema';
import { isPage, replaceChildNode } from '@tmagic/utils';

export default defineComponent({
  name: 'App',

  setup() {
    const app = inject<Core | undefined>('app');
    const pageConfig = ref(app?.page?.data || {});

    app?.on('page-change', (page: Page | string) => {
      if (typeof page === 'string') {
        throw new Error(`ID为${page}的页面不存在`);
      }
      //   pageConfig.value = page.data; // 此方式不会更改url上链接的page参数
      const url = new URL(window.location.href);
      const { searchParams } = url;
      searchParams.set('page', page.data.id as string);
      const newUrl = url.toString();
      window.location.href = newUrl;
    });

    app?.dataSourceManager?.on('update-data', (nodes: MNode[], sourceId: string, changeEvent: ChangeEvent) => {
      nodes.forEach((node) => {
        if (isPage(node)) {
          pageConfig.value = node;
        } else {
          replaceChildNode(reactive(node), [pageConfig.value as MNode]);
        }
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
