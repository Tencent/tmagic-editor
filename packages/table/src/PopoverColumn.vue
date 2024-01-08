<template>
  <TMagicTableColumn :label="config.label" :width="config.width" :fixed="config.fixed">
    <template v-slot="scope">
      <TMagicPopover
        v-if="config.popover"
        :placement="config.popover.placement"
        :width="config.popover.width"
        :trigger="config.popover.trigger"
      >
        <MTable
          v-if="config.popover.tableEmbed"
          :show-header="config.showHeader"
          :columns="config.table"
          :data="(config.prop && scope.row[config.prop]) || []"
        ></MTable>
        <template #reference>
          <TMagicButton link type="primary"> {{ config.text || formatter(config, scope.row) }}</TMagicButton>
        </template>
      </TMagicPopover>
    </template>
  </TMagicTableColumn>
</template>

<script lang="ts" setup>
import { TMagicButton, TMagicPopover, TMagicTableColumn } from '@tmagic/design';

import { ColumnConfig } from './schema';
import MTable from './Table.vue';
import { formatter } from './utils';

defineOptions({
  name: 'MTablePopoverColumn',
});

withDefaults(
  defineProps<{
    config: ColumnConfig;
  }>(),
  {
    config: () => ({}),
  },
);
</script>
