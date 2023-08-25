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
      <component :is="config.component" v-bind="componentProps(scope.row)"></component>
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

const componentProps = (row: any) => {
  if (typeof props.config.props === 'function') {
    return props.config.props(row) || {};
  }
  return props.config.props || {};
};
</script>
