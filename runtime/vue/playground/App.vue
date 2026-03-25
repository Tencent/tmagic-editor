<template>
  <component v-if="pageConfig" :is="pageComponent" :key="pageConfig.id" :config="pageConfig"></component>
</template>

<script lang="ts" setup>
import { useComponent, useEditorDsl } from '@tmagic/vue-runtime-help';

const { pageConfig } = useEditorDsl();
const pageComponent = useComponent('page');
</script>
