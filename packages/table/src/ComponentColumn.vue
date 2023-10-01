<template>
  <TMagicTableColumn
    show-overflow-tooltip
    :label="config.label"
    :width="config.width"
    :fixed="config.fixed"
    :sortable="config.sortable"
    :prop="config.prop"
  >
    <template v-slot="scope">
      <component
        :is="config.component"
        v-bind="componentProps(scope.row, scope.$index)"
        v-on="componentListeners(scope.row, scope.$index)"
      ></component>
    </template>
  </TMagicTableColumn>
</template>

<script lang="ts" setup>
import { TMagicTableColumn } from '@tmagic/design';

import { ColumnConfig } from './schema';

defineOptions({
  name: 'MTableColumn',
});

const props = withDefaults(
  defineProps<{
    config: ColumnConfig;
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
