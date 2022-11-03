<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <template #default="{ $index, row }">
      <slot :$index="$index" :row="row"></slot>
    </template>
  </component>
</template>

<script setup lang="ts" name="TMTableColumn">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  label?: string;
  align?: string;
  fixed?: string | boolean;
  width?: string | number;
}>();

const uiComponent = getConfig('components').tableColumn;

const uiProps = computed(() => uiComponent.props(props));
</script>
