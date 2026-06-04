<template>
  <div v-if="!buckets.length" class="m-editor-history-list-empty">暂无操作记录</div>
  <TMagicScrollbar v-else max-height="360px">
    <Bucket
      v-for="bucket in buckets"
      :key="`${prefix}-${bucket.id}`"
      :title="title"
      :bucket-id="bucket.id"
      :prefix="prefix"
      :groups="bucket.groups"
      :describe-group="describeGroup"
      :describe-step="describeStep"
      :is-step-diffable="isStepDiffable"
      :is-step-revertable="isStepRevertable"
      :expanded="expanded"
      :goto-enabled="gotoEnabled"
      @toggle="(key: string) => $emit('toggle', key)"
      @goto="(id: string | number, index: number) => $emit('goto', id, index)"
      @goto-initial="(id: string | number) => $emit('goto-initial', id)"
      @diff-step="(id: string | number, index: number) => $emit('diff-step', id, index)"
      @revert-step="(id: string | number, index: number) => $emit('revert-step', id, index)"
    />
  </TMagicScrollbar>
</template>

<script lang="ts" setup>
import { TMagicScrollbar } from '@tmagic/design';

import Bucket from './Bucket.vue';

defineOptions({
  name: 'MEditorHistoryListBucketTab',
});

withDefaults(
  defineProps<{
    /** bucket 头部展示的标题，例如 "数据源" / "代码块"。 */
    title: string;
    /** 子项 key 的命名空间前缀（`ds` 数据源 / `cb` 代码块），与上层折叠状态 key 保持一致。 */
    prefix: string;
    /**
     * 已按目标 id 聚拢成的 bucket 列表，每个 bucket 内部的 groups 已按时间倒序排好。
     * 空数组时显示空态。
     */
    buckets: { id: string | number; groups: any[] }[];
    /** 组级描述文案生成器，由父组件按业务类型注入。 */
    describeGroup: (_group: any) => string;
    /** 单步描述文案生成器，由父组件按业务类型注入。 */
    describeStep: (_step: any) => string;
    /** 判断某个 step 是否可查看差异（前后值都存在）。由父组件按业务类型注入。 */
    isStepDiffable: (_step: any) => boolean;
    /** 判断某个 step 是否支持回滚（如更新需带 changeRecords）。由父组件按业务类型注入；不传则已应用即可回滚。 */
    isStepRevertable?: (_step: any) => boolean;
    /**
     * 共享的折叠状态表（key -> 是否展开），由顶层 panel 统一维护。
     * 本 tab 使用 `${prefix}-${id}-${组内首步 index}` 作为 key——以稳定的 step 索引而非展示位置标识分组，
     * 这样历史数据更新后已展开的分组状态仍能正确保持。
     */
    expanded: Record<string, boolean>;
    /** 是否支持「跳转到该记录」(goto)，透传给 Bucket。默认 true。 */
    gotoEnabled?: boolean;
  }>(),
  {
    gotoEnabled: true,
  },
);

defineEmits<{
  /** 透传子组件 Bucket 的 toggle 事件给上层 panel，由其更新 expanded。 */
  (_e: 'toggle', _key: string): void;
  /** 透传 Bucket 的 goto 事件，携带目标 id 与目标 step 索引。 */
  (_e: 'goto', _targetId: string | number, _index: number): void;
  /** 透传 Bucket 的 goto-initial 事件，携带目标 id（回到该目标未修改时的状态）。 */
  (_e: 'goto-initial', _targetId: string | number): void;
  /** 透传 Bucket 的 diff-step 事件，携带目标 id 与 step 索引。 */
  (_e: 'diff-step', _targetId: string | number, _index: number): void;
  /** 透传 Bucket 的 revert-step 事件，携带目标 id 与 step 索引（类 git revert）。 */
  (_e: 'revert-step', _targetId: string | number, _index: number): void;
}>();
</script>
