<template>
  <div v-if="!buckets.length" class="m-editor-history-list-empty">暂无操作记录</div>
  <TMagicScrollbar v-else max-height="360px">
    <Bucket
      v-for="bucket in buckets"
      :key="`ds-${bucket.id}`"
      title="数据源"
      :bucket-id="bucket.id"
      prefix="ds"
      :groups="bucket.groups"
      :describe-group="describeDataSourceGroup"
      :describe-step="describeDataSourceStep"
      :expanded="expanded"
      @toggle="(key: string) => $emit('toggle', key)"
    />
  </TMagicScrollbar>
</template>

<script lang="ts" setup>
import { TMagicScrollbar } from '@tmagic/design';

import type { DataSourceHistoryGroup } from '@editor/type';

import Bucket from './Bucket.vue';
import { describeDataSourceGroup, describeDataSourceStep } from './composables';

defineOptions({
  name: 'MEditorHistoryListDataSourceTab',
});

defineProps<{
  /**
   * 已按 dataSource.id 聚拢成的 bucket 列表，每个 bucket 内部的 groups 已按时间倒序排好。
   * 空数组时显示空态。
   */
  buckets: { id: string | number; groups: DataSourceHistoryGroup[] }[];
  /** 共享的折叠状态表（key -> 是否展开），由顶层 panel 统一维护。本 tab 使用 `ds-${id}-${idx}` 作为 key。 */
  expanded: Record<string, boolean>;
}>();

defineEmits<{
  /** 透传子组件 Bucket 的 toggle 事件给上层 panel，由其更新 expanded。 */
  (_e: 'toggle', _key: string): void;
}>();
</script>
