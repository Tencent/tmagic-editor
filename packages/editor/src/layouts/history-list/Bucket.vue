<template>
  <div class="m-editor-history-list-bucket">
    <div class="m-editor-history-list-bucket-title">
      <span>{{ config.title }}</span>
      <code>{{ String(bucketId) }}</code>
      <span class="m-editor-history-list-bucket-count">{{ groups.length }} 组</span>
    </div>

    <ul class="m-editor-history-list-ul">
      <GroupRow
        v-for="group in groups"
        :key="rowKey(group)"
        :group="toRow(group)"
        :expanded="isHistoryGroupExpanded(expanded, rowKey(group))"
        :goto-enabled="config.gotoEnabled"
        @toggle="(key: string) => $emit('toggle', key)"
        @goto="(index: number) => $emit('goto', bucketId, index)"
        @diff-step="(index: number) => $emit('diff-step', bucketId, index)"
        @revert-step="(index: number) => $emit('revert-step', bucketId, index)"
      />
      <!--
        初始状态项：永远位于该 bucket 列表底部（同样按倒序展示，最底部 = 最早状态）。
        当 bucket 内所有 group 都未 applied 时即为当前位置。
        config.showInitial=false 时不展示（用于没有"撤销到初始状态"语义的自定义历史，如业务模块历史）。
      -->
      <InitialRow
        v-if="config.showInitial !== false"
        :is-current="isInitial"
        :goto-enabled="config.gotoEnabled"
        @goto-initial="$emit('goto-initial', bucketId)"
      />
    </ul>
  </div>
</template>

<script lang="ts" setup generic="T extends BaseStepValue = BaseStepValue">
import { computed } from 'vue';

import type { BaseStepValue, HistoryBucketConfig } from '@editor/type';

import type { HistoryBucketGroup, HistoryRowGroup } from './composables';
import { isHistoryGroupExpanded, toRowGroup } from './composables';
import GroupRow from './GroupRow.vue';
import InitialRow from './InitialRow.vue';

defineOptions({
  name: 'MEditorHistoryListBucket',
});

const props = defineProps<{
  /**
   * 该类历史的整体渲染配置（title / prefix / describe* / isStep* / showInitial / gotoEnabled）。
   * 由父组件按业务类型注入，组件内部按需读取，避免逐项透传多个 props。
   */
  config: HistoryBucketConfig<T>;
  /** 当前 bucket 对应的目标 id（dataSource.id 或 codeBlock.id），同时用于组装子项的 key。 */
  bucketId: string | number;
  /** 当前 bucket 下的所有历史分组，按时间倒序展示（最近的操作在前）。 */
  groups: HistoryBucketGroup<T>[];
  /** 共享的折叠状态表（key -> 是否展开，缺省或 true 为展开、false 为收起），由顶层 panel 统一维护以便跨 tab 复用。 */
  expanded: Record<string, boolean>;
}>();

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

/**
 * 子项 / 折叠状态 key：`${prefix}-${bucketId}-${组内首步 index}`。
 * 以稳定的 step 索引（而非展示位置）标识分组，历史数据更新后已展开的分组状态仍能正确保持。
 */
const rowKey = (group: HistoryBucketGroup<T>) => `${props.config.prefix}-${props.bucketId}-${group.steps[0]?.index}`;

/** 把原始分组派生为 GroupRow 直接消费的视图模型。 */
const toRow = (group: HistoryBucketGroup<T>): HistoryRowGroup => toRowGroup(group, rowKey(group), props.config);

/** 该 bucket 是否处于初始状态（栈 cursor=0），等价于全部 group 都未 applied。 */
const isInitial = computed(() => props.groups.length > 0 && props.groups.every((g) => !g.applied));
</script>
