<template>
  <component
    :is="config.component"
    v-bind="resolveComponentProps(config, row, index)"
    v-on="resolveComponentListeners(config, row, index)"
  ></component>
</template>

<script lang="ts" setup>
import { resolveComponentListeners, resolveComponentProps } from './componentHelpers';
import { ColumnConfig } from './schema';

defineOptions({
  name: 'MTableColumn',
});

withDefaults(
  defineProps<{
    config: ColumnConfig;
    row: any;
    index: number;
  }>(),
  {
    config: () => ({}),
  },
);
</script>
