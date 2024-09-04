<template>
  <component :is="pageComponent" :config="pageConfig"></component>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';

import type { Page } from '@tmagic/core';
import type TMagicApp from '@tmagic/core';
import { addParamToUrl } from '@tmagic/core';
import { useComponent, useDsl } from '@tmagic/vue-runtime-help';

export default defineComponent({
  name: 'App',

  setup() {
    const app = inject<TMagicApp>('app');
    const { pageConfig } = useDsl(app);
    const pageComponent = useComponent('page');

    app?.on('page-change', (page?: Page) => {
      if (!page) {
        throw new Error(`页面不存在`);
      }
      addParamToUrl({ page: page.data.id }, window);
    });

    return {
      pageComponent,
      pageConfig,
    };
  },
});
</script>
