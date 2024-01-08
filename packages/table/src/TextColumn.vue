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
      <TMagicForm v-if="config.type && editState[scope.$index]" label-width="0" :model="editState[scope.$index]">
        <m-form-container
          :prop="config.prop"
          :rules="config.rules"
          :config="config"
          :name="config.prop"
          :model="editState[scope.$index]"
        ></m-form-container>
      </TMagicForm>

      <TMagicButton
        v-else-if="config.action === 'actionLink' && config.prop"
        link
        type="primary"
        @click="config.handler?.(scope.row)"
      >
        <span v-html="formatter(config, scope.row)"></span>
      </TMagicButton>

      <a v-else-if="config.action === 'img' && config.prop" target="_blank" :href="scope.row[config.prop]"
        ><img :src="scope.row[config.prop]" height="50"
      /></a>

      <a
        v-else-if="config.action === 'link' && config.prop"
        target="_blank"
        :href="scope.row[config.prop]"
        class="keep-all"
        >{{ scope.row[config.prop] }}</a
      >

      <el-tooltip v-else-if="config.action === 'tip'" placement="left">
        <template #content>
          <div>{{ formatter(config, scope.row) }}</div>
        </template>
        <TMagicButton link type="primary">{{ config.buttonText || '扩展配置' }}</TMagicButton>
      </el-tooltip>

      <TMagicTag
        v-else-if="config.action === 'tag' && config.prop"
        :type="typeof config.type === 'function' ? config.type(scope.row[config.prop], scope.row) : config.type"
        close-transition
        >{{ formatter(config, scope.row) }}</TMagicTag
      >
      <div v-else v-html="formatter(config, scope.row)"></div>
    </template>
  </TMagicTableColumn>
</template>

<script lang="ts" setup>
import { TMagicButton, TMagicForm, TMagicTableColumn, TMagicTag } from '@tmagic/design';

import { ColumnConfig } from './schema';
import { formatter } from './utils';

defineOptions({
  name: 'MTableColumn',
});

withDefaults(
  defineProps<{
    config: ColumnConfig;
    editState?: any;
  }>(),
  {
    config: () => ({}),
    editState: () => ({}),
  },
);
</script>
