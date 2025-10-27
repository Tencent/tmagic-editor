<template>
  <div v-if="config.type === 'index'">
    {{ config.pageIndex && config.pageSize ? config.pageIndex * config.pageSize + index + 1 : index + 1 }}
  </div>
  <TMagicForm v-else-if="config.type && editState[index]" label-width="0" :model="editState[index]">
    <m-form-container
      :prop="config.prop"
      :rules="config.rules"
      :config="config"
      :name="config.prop"
      :model="editState[index]"
    ></m-form-container>
  </TMagicForm>

  <TMagicButton
    v-else-if="config.action === 'actionLink' && config.prop"
    link
    type="primary"
    @click="config.handler?.(row)"
  >
    <span v-html="formatter(config, row, { index: index })"></span>
  </TMagicButton>

  <a v-else-if="config.action === 'img' && config.prop" target="_blank" :href="row[config.prop]"
    ><img :src="row[config.prop]" height="50"
  /></a>

  <a v-else-if="config.action === 'link' && config.prop" target="_blank" :href="row[config.prop]" class="keep-all">{{
    row[config.prop]
  }}</a>

  <TMagicTooltip v-else-if="config.action === 'tip'" placement="left">
    <template #content>
      <div>{{ formatter(config, row, { index: index }) }}</div>
    </template>
    <TMagicButton link type="primary">{{ config.buttonText || '扩展配置' }}</TMagicButton>
  </TMagicTooltip>

  <TMagicTag
    v-else-if="config.action === 'tag' && config.prop"
    :type="typeof config.type === 'function' ? config.type(row[config.prop], row) : config.type"
    close-transition
    >{{ formatter(config, row, { index: index }) }}</TMagicTag
  >
  <div v-else v-html="formatter(config, row, { index: index })"></div>
</template>

<script lang="ts" setup>
import { TMagicButton, TMagicForm, TMagicTag, TMagicTooltip } from '@tmagic/design';

import { ColumnConfig } from './schema';
import { formatter } from './utils';

defineOptions({
  name: 'MTableColumn',
});

withDefaults(
  defineProps<{
    config: ColumnConfig;
    editState?: any;
    row: any;
    index: number;
  }>(),
  {
    config: () => ({}),
    editState: () => ({}),
  },
);
</script>
