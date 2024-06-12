<template>
  <magic-ui-page v-if="pageConfig" :key="pageConfig.id" :config="pageConfig"></magic-ui-page>
</template>

<script lang="ts" setup>
import { inject } from 'vue';

import type Core from '@tmagic/core';
import { useEditorDsl } from '@tmagic/vue-runtime-help';

const app = inject<Core | undefined>('app');
const { pageConfig } = useEditorDsl(app);
</script>
