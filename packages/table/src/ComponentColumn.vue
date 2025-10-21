<template>
  <component
    :is="config.component"
    v-bind="componentProps(row, index)"
    v-on="componentListeners(row, index)"
  ></component>
</template>

<script lang="ts" setup>
import { ColumnConfig } from './schema';

defineOptions({
  name: 'MTableColumn',
});

const props = withDefaults(
  defineProps<{
    config: ColumnConfig;
    row: any;
    index: number;
  }>(),
  {
    config: () => ({}),
  },
);

const componentProps = (row: any, index: number) => {
  if (typeof props.config.props === 'function') {
    return props.config.props(row, index) || {};
  }
  return props.config.props || {};
};

const componentListeners = (row: any, index: number) => {
  if (typeof props.config.listeners === 'function') {
    return props.config.listeners(row, index) || {};
  }
  return props.config.listeners || {};
};
</script>
