<template>
  <magic-ui-page :config="pageConfig"></magic-ui-page>
</template>

<script lang="ts" setup>
import { inject } from 'vue';

import type { Page } from '@tmagic/core';
import Core from '@tmagic/core';
import { addParamToUrl } from '@tmagic/utils';
import { useDsl } from '@tmagic/vue-runtime-help';

const { pageConfig } = useDsl();

const app = inject<Core | undefined>('app');

app?.on('page-change', (page?: Page) => {
  if (!page) {
    throw new Error(`页面不存在`);
  }
  addParamToUrl({ page: page.data.id }, window);
});
</script>
