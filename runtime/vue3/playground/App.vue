<template>
  <component v-if="pageConfig" :is="pageComponent" :key="pageConfig.id" :config="pageConfig"></component>
</template>

<script lang="ts" setup>
import { inject } from 'vue';

import type TMagicApp from '@tmagic/core';
import { useComponent, useEditorDsl } from '@tmagic/vue-runtime-help';

const app = inject<TMagicApp>('app');
const { pageConfig } = useEditorDsl(app);
const pageComponent = useComponent('page');
</script>
