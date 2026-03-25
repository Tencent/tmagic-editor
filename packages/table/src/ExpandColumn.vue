<template>
  <MTable
    v-if="config.table"
    :show-header="false"
    :columns="config.table"
    :data="(config.prop && row[config.prop]) || []"
  ></MTable>
  <MForm
    v-if="config.form"
    :config="config.form"
    :init-values="config.values || (config.prop && row[config.prop]) || {}"
  ></MForm>
  <div v-if="config.expandContent" v-html="config.expandContent(row, config.prop)"></div>
  <component v-if="config.component" :is="config.component" v-bind="componentProps(row)"></component>
</template>

<script lang="ts" setup>
import { MForm } from '@tmagic/form';

import { ColumnConfig } from './schema';
import MTable from './Table.vue';

defineOptions({
  name: 'MTableExpandColumn',
});

const props = withDefaults(
  defineProps<{
    config: ColumnConfig;
    row: any;
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
