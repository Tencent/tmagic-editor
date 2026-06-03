<template>
  <div class="m-editor-history-list-bucket">
    <div class="m-editor-history-list-bucket-title">
      <span>{{ title }}</span>
      <code>{{ String(bucketId) }}</code>
      <span class="m-editor-history-list-bucket-count">{{ groups.length }} 组</span>
    </div>

    <ul class="m-editor-history-list-ul">
      <GroupRow
        v-for="group in groups"
        :key="`${prefix}-${bucketId}-${group.steps[0]?.index}`"
        :group-key="`${prefix}-${bucketId}-${group.steps[0]?.index}`"
        :applied="group.applied"
        :merged="group.steps.length > 1"
        :op-type="group.opType"
        :desc="describeGroup(group)"
        :time="formatHistoryTime(groupTimestamp(group))"
        :time-title="formatHistoryFullTime(groupTimestamp(group))"
        :step-count="group.steps.length"
        :sub-steps="
          group.steps.map((s: any) => ({
            index: s.index,
            applied: s.applied,
            isCurrent: s.isCurrent,
            desc: describeStep(s.step),
            diffable: isStepDiffable ? isStepDiffable(s.step) : false,
            revertable: s.applied,
            time: formatHistoryTime(s.step.timestamp),
            timeTitle: formatHistoryFullTime(s.step.timestamp),
          }))
        "
        :is-current="group.isCurrent"
        :expanded="!!expanded[`${prefix}-${bucketId}-${group.steps[0]?.index}`]"
        :goto-enabled="gotoEnabled"
        @toggle="(key: string) => $emit('toggle', key)"
        @goto="(index: number) => $emit('goto', bucketId, index)"
        @diff-step="(index: number) => $emit('diff-step', bucketId, index)"
        @revert-step="(index: number) => $emit('revert-step', bucketId, index)"
      />
      <!--
        初始状态项：永远位于该 bucket 列表底部（同样按倒序展示，最底部 = 最早状态）。
        当 bucket 内所有 group 都未 applied 时即为当前位置。
        showInitial=false 时不展示（用于没有"撤销到初始状态"语义的自定义历史，如业务模块历史）。
      -->
      <InitialRow
        v-if="showInitial !== false"
        :is-current="isInitial"
        :goto-enabled="gotoEnabled"
        @goto-initial="$emit('goto-initial', bucketId)"
      />
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import type { HistoryOpType } from '@editor/type';

import { formatHistoryFullTime, formatHistoryTime, groupTimestamp } from './composables';
import GroupRow from './GroupRow.vue';
import InitialRow from './InitialRow.vue';

defineOptions({
  name: 'MEditorHistoryListBucket',
});

const props = withDefaults(
  defineProps<{
    /** Bucket 标题，例如 "数据源" / "代码块"，渲染在 bucket 头部。 */
    title: string;
    /** 当前 bucket 对应的目标 id（dataSource.id 或 codeBlock.id），同时用于组装子项的 key。 */
    bucketId: string | number;
    /**
     * 子项 key 的命名空间前缀：内置 `ds` 表示数据源，`cb` 表示代码块；
     * 业务方复用 Bucket 时可传入自定义前缀（如 `mod`）。与上层折叠状态 key 保持一致。
     */
    prefix: string;
    /** 是否展示底部「回到初始状态」入口，默认 true。无 undo cursor 语义的自定义历史可传 false 关闭。 */
    showInitial?: boolean;
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
    /** 判断某个 step 是否可查看差异（前后值都存在）。由父组件按业务类型注入；不传则一律不展示差异入口。 */
    isStepDiffable?: (_step: any) => boolean;
    /** 共享的折叠状态表（key -> 是否展开），由顶层 panel 统一维护以便跨 tab 复用。 */
    expanded: Record<string, boolean>;
    /** 是否支持「跳转到该记录」(goto)。默认 true。 */
    gotoEnabled?: boolean;
  }>(),
  {
    showInitial: true,
    gotoEnabled: true,
  },
);

defineEmits<{
  /** 透传子组件 GroupRow 的 toggle，由上层 panel 更新 expanded。 */
  (_e: 'toggle', _key: string): void;
  /**
   * 透传子组件 GroupRow 的 goto，并附带当前 bucket 对应的 id（dataSourceId / codeBlockId），
   * 上层据此调用对应 service.goto(id, targetCursor)。
   */
  (_e: 'goto', _bucketId: string | number, _index: number): void;
  /** 用户点击初始项希望该 bucket 回到未修改状态；携带 bucketId 用于上层路由到正确的 service。 */
  (_e: 'goto-initial', _bucketId: string | number): void;
  /** 用户点击"查看差异"，携带 bucketId 与 step 索引。 */
  (_e: 'diff-step', _bucketId: string | number, _index: number): void;
  /** 用户点击"回滚"按钮，携带 bucketId 与 step 索引，类 git revert。 */
  (_e: 'revert-step', _bucketId: string | number, _index: number): void;
}>();

/** 该 bucket 是否处于初始状态（栈 cursor=0），等价于全部 group 都未 applied。 */
const isInitial = computed(() => props.groups.length > 0 && props.groups.every((g) => !g.applied));
</script>
