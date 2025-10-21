<template>
  <TMagicPopover
    v-if="config.popover"
    :placement="config.popover.placement"
    :width="config.popover.width"
    :trigger="config.popover.trigger"
    :destroy-on-close="config.popover.destroyOnClose ?? true"
  >
    <MTable
      v-if="config.popover.tableEmbed"
      :show-header="config.showHeader"
      :columns="config.table"
      :data="(config.prop && row[config.prop]) || []"
    ></MTable>
    <template #reference>
      <TMagicButton link type="primary">{{ config.text || formatter(config, row, { index: index }) }}</TMagicButton>
    </template>
  </TMagicPopover>
</template>

<script lang="ts" setup>
import { TMagicButton, TMagicPopover } from '@tmagic/design';

import { ColumnConfig } from './schema';
import MTable from './Table.vue';
import { formatter } from './utils';

defineOptions({
  name: 'MTablePopoverColumn',
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
