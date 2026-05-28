<template>
  <div class="m-editor-history-list-bucket">
    <div class="m-editor-history-list-bucket-title">
      <span>{{ title }}</span>
      <code>{{ String(bucketId) }}</code>
      <span class="m-editor-history-list-bucket-count">{{ groups.length }} 组</span>
    </div>

    <ul class="m-editor-history-list-ul">
      <GroupRow
        v-for="(group, gIdx) in groups"
        :key="`${prefix}-${bucketId}-${gIdx}`"
        :group-key="`${prefix}-${bucketId}-${gIdx}`"
        :applied="group.applied"
        :merged="group.steps.length > 1"
        :op-type="group.opType"
        :desc="describeGroup(group)"
        :step-count="group.steps.length"
        :sub-steps="
          group.steps.map((s: any) => ({
            index: s.index,
            applied: s.applied,
            isCurrent: s.isCurrent,
            desc: describeStep(s.step),
          }))
        "
        :is-current="group.isCurrent"
        :expanded="!!expanded[`${prefix}-${bucketId}-${gIdx}`]"
        @toggle="(key: string) => $emit('toggle', key)"
      />
    </ul>
  </div>
</template>

<script lang="ts" setup>
import type { HistoryOpType } from '@editor/type';

import GroupRow from './GroupRow.vue';

defineOptions({
  name: 'MEditorHistoryListBucket',
});

defineProps<{
  /** Bucket 标题，例如 "数据源" / "代码块"，渲染在 bucket 头部。 */
  title: string;
  /** 当前 bucket 对应的目标 id（dataSource.id 或 codeBlock.id），同时用于组装子项的 key。 */
  bucketId: string | number;
  /** 子项 key 的命名空间前缀：`ds` 表示数据源，`cb` 表示代码块。与上层折叠状态 key 保持一致。 */
  prefix: 'ds' | 'cb';
  /** 当前 bucket 下的所有历史分组，按时间倒序展示（最近的操作在前）。 */
  groups: {
    applied: boolean;
    isCurrent?: boolean;
    opType: HistoryOpType;
    steps: { index: number; applied: boolean; isCurrent?: boolean; step: any }[];
  }[];
  /** 组级描述文案生成器，接收一个 group，返回展示文本。由父组件按业务类型注入。 */
  describeGroup: (_group: any) => string;
  /** 单步描述文案生成器，接收一个 step，返回展示文本。用于合并组展开后的子步列表。 */
  describeStep: (_step: any) => string;
  /** 共享的折叠状态表（key -> 是否展开），由顶层 panel 统一维护以便跨 tab 复用。 */
  expanded: Record<string, boolean>;
}>();

defineEmits<{
  /** 透传子组件 GroupRow 的 toggle，由上层 panel 更新 expanded。 */
  (_e: 'toggle', _key: string): void;
}>();
</script>
