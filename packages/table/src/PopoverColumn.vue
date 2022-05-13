<template>
  <el-table-column :label="config.label" :width="config.width" :fixed="config.fixed">
    <template v-slot="scope">
      <el-popover :placement="config.popover.placement" :width="config.popover.width" :trigger="config.popover.trigger">
        <m-table
          v-if="config.popover.tableEmbed"
          :show-header="config.showHeader"
          :columns="config.table"
          :data="scope.row[config.prop]"
        ></m-table>
        <template #reference>
          <el-button text type="primary"> {{ config.text || formatter(config, scope.row) }}</el-button>
        </template>
      </el-popover>
    </template>
  </el-table-column>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { ColumnConfig } from './schema';
import { formatter } from './utils';

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<ColumnConfig>,
      default: () => ({}),
      required: true,
    },
  },

  setup() {
    return {
      formatter,
    };
  },
});
</script>
