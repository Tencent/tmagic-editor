<template>
  <component :is="pageComponent" :config="(pageConfig as MPage)"></component>
</template>

<script lang="ts" setup>
import { inject } from 'vue';
import { MPage } from 'packages/schema/types';

import type { Page } from '@tmagic/core';
import type Core from '@tmagic/core';
import { addParamToUrl } from '@tmagic/utils';
import { useComponent, useDsl } from '@tmagic/vue-runtime-help';

const app = inject<Core | undefined>('app');
const { pageConfig } = useDsl(app);
const pageComponent = useComponent('page');

app?.on('page-change', (page?: Page) => {
  if (!page) {
    throw new Error(`页面不存在`);
  }
  addParamToUrl({ page: page.data.id }, window);
});
</script>
