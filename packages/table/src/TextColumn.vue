<template>
  <el-table-column
    show-overflow-tooltip
    :label="config.label"
    :width="config.width"
    :fixed="config.fixed"
    :sortable="config.sortable"
    :prop="config.prop"
  >
    <template v-slot="scope">
      <el-form v-if="config.type && editState[scope.$index]" label-width="0" :model="editState[scope.$index]">
        <m-form-container
          :prop="config.prop"
          :rules="config.rules"
          :config="config"
          :name="config.prop"
          :model="editState[scope.$index]"
        ></m-form-container>
      </el-form>

      <el-button v-else-if="config.action === 'actionLink'" text type="primary" @click="config.handler(scope.row)">
        {{ formatter(config, scope.row) }}
      </el-button>

      <a v-else-if="config.action === 'img'" target="_blank" :href="scope.row[config.prop]"
        ><img :src="scope.row[config.prop]" height="50"
      /></a>

      <a v-else-if="config.action === 'link'" target="_blank" :href="scope.row[config.prop]" class="keep-all">{{
        scope.row[config.prop]
      }}</a>

      <el-tooltip v-else-if="config.action === 'tip'" placement="left">
        <template #content>
          <div>{{ formatter(config, scope.row) }}</div>
        </template>
        <el-button text type="primary">扩展配置</el-button>
      </el-tooltip>

      <el-tag
        v-else-if="config.action === 'tag'"
        :type="typeof config.type === 'function' ? config.type(scope.row[config.prop], scope.row) : config.type"
        close-transition
        >{{ formatter(config, scope.row) }}</el-tag
      >
      <div v-else v-html="formatter(config, scope.row)"></div>
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

    editState: {
      type: Object,
      default: () => {},
    },
  },

  setup() {
    return {
      formatter,
    };
  },
});
</script>
