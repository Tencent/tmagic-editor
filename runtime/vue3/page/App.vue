<template>
  <component :is="pageComponent" :config="(pageConfig as MPage)"></component>
</template>

<script lang="ts" setup>
import { inject, reactive } from 'vue';

import type { Id, MPage, Page } from '@tmagic/core';
import type TMagicApp from '@tmagic/core';
import { addParamToUrl, cloneDeep, DevtoolApi, getNodeInfo, replaceChildNode, setValueByKeyPath } from '@tmagic/core';
import { useComponent, useDsl } from '@tmagic/vue-runtime-help';

const app = inject<TMagicApp>('app');
const { pageConfig } = useDsl(app);
const pageComponent = useComponent('page');

app?.on('page-change', (page?: Page) => {
  if (!page) {
    throw new Error(`页面不存在`);
  }
  addParamToUrl({ page: page.data.id }, window);
});

if (import.meta.env.DEV && app) {
  app.devtools = new (class extends DevtoolApi {
    public updateDsl(nodeId: Id, data: any, path: string) {
      if (!app.dsl) {
        return;
      }

      const { node } = getNodeInfo(nodeId, app.dsl);

      if (!node) {
        return;
      }

      const newNode = cloneDeep(node);

      setValueByKeyPath(path, data, newNode);

      replaceChildNode(reactive(newNode), [pageConfig.value as MPage]);

      return;
    }
  })({ app });
}
</script>
