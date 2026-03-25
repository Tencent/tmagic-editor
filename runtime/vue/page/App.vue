<template>
  <component :is="pageComponent" :config="pageConfig as MPage"></component>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';

import type { Id, MPage } from '@tmagic/core';
import { cloneDeep, DevtoolApi, getNodeInfo, replaceChildNode, setValueByKeyPath } from '@tmagic/core';
import { useComponent, useDsl } from '@tmagic/vue-runtime-help';

const { pageConfig, app } = useDsl();
const pageComponent = useComponent('page');

if (import.meta.env.DEV) {
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
