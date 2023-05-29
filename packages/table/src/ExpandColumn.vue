<template>
  <TMagicTableColumn type="expand">
    <template #default="scope">
      <MTable
        v-if="config.table"
        :show-header="false"
        :columns="config.table"
        :data="(config.prop && scope.row[config.prop]) || []"
      ></MTable>
      <MForm
        v-if="config.form"
        :config="config.form"
        :init-values="config.values || (config.prop && scope.row[config.prop]) || {}"
      ></MForm>
      <div v-if="config.expandContent" v-html="config.expandContent(scope.row, config.prop)"></div>
      <component v-if="config.component" :is="config.component" v-bind="componentProps(scope.row)"></component>
    </template>
  </TMagicTableColumn>
</template>

<script lang="ts" setup>
import { TMagicTableColumn } from '@tmagic/design';
import { MForm } from '@tmagic/form';

import { ColumnConfig } from './schema';
import MTable from './Table.vue';

defineOptions({
  name: 'MTableExpandColumn',
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
