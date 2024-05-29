<template>
  <magic-ui-page v-if="pageConfig" :key="pageConfig.id" :config="pageConfig"></magic-ui-page>
</template>

<script lang="ts" setup>
import { useEditorDsl } from '@tmagic/vue-runtime-help';

const { pageConfig } = useEditorDsl();
</script>
