<template>
  <div v-if="!buckets.length" class="m-editor-history-list-empty">暂无操作记录</div>
  <TMagicScrollbar v-else max-height="360px">
    <Bucket
      v-for="bucket in buckets"
      :key="`cb-${bucket.id}`"
      title="代码块"
      :bucket-id="bucket.id"
      prefix="cb"
      :groups="bucket.groups"
      :describe-group="describeCodeBlockGroup"
      :describe-step="describeCodeBlockStep"
      :expanded="expanded"
      @toggle="(key: string) => $emit('toggle', key)"
    />
  </TMagicScrollbar>
</template>

<script lang="ts" setup>
import { TMagicScrollbar } from '@tmagic/design';

import type { CodeBlockHistoryGroup } from '@editor/type';

import Bucket from './Bucket.vue';
import { describeCodeBlockGroup, describeCodeBlockStep } from './composables';

defineOptions({
  name: 'MEditorHistoryListCodeBlockTab',
});

defineProps<{
  /**
   * 已按 codeBlock.id 聚拢成的 bucket 列表，每个 bucket 内部的 groups 已按时间倒序排好。
   * 空数组时显示空态。
   */
  buckets: { id: string | number; groups: CodeBlockHistoryGroup[] }[];
  /** 共享的折叠状态表（key -> 是否展开），由顶层 panel 统一维护。本 tab 使用 `cb-${id}-${idx}` 作为 key。 */
  expanded: Record<string, boolean>;
}>();

defineEmits<{
  /** 透传子组件 Bucket 的 toggle 事件给上层 panel，由其更新 expanded。 */
  (_e: 'toggle', _key: string): void;
}>();
</script>
