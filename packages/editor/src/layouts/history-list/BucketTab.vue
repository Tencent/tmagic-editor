<template>
  <div v-if="!buckets.length" class="m-editor-history-list-empty">暂无操作记录</div>
  <template v-else>
    <div v-if="config.showClear !== false" class="m-editor-history-list-toolbar">
      <span class="m-editor-history-list-clear" :title="`清空${config.title}的历史记录`" @click="$emit('clear')"
        >清空</span
      >
    </div>
    <TMagicScrollbar max-height="360px">
      <Bucket
        v-for="bucket in buckets"
        :key="`${config.prefix}-${bucket.id}`"
        :config="config"
        :bucket-id="bucket.id"
        :groups="bucket.groups"
        :expanded="expanded"
        @toggle="(key: string) => $emit('toggle', key)"
        @goto="(id: string | number, index: number) => $emit('goto', id, index)"
        @goto-initial="(id: string | number) => $emit('goto-initial', id)"
        @diff-step="(id: string | number, index: number) => $emit('diff-step', id, index)"
        @revert-step="(id: string | number, index: number) => $emit('revert-step', id, index)"
      />
    </TMagicScrollbar>
  </template>
</template>

<script lang="ts" setup generic="T extends BaseStepValue = BaseStepValue">
import { TMagicScrollbar } from '@tmagic/design';

import type { BaseStepValue, HistoryBucketConfig } from '@editor/type';

import Bucket from './Bucket.vue';
import type { HistoryBucketGroup } from './composables';

defineOptions({
  name: 'MEditorHistoryListBucketTab',
});

defineProps<{
  /**
   * 该类历史的整体渲染配置（title / prefix / describe* / isStep* / showInitial / gotoEnabled / showClear），
   * 由父组件按业务类型注入并整体透传给 Bucket，避免逐项透传多个 props。
   */
  config: HistoryBucketConfig<T>;
  /**
   * 已按目标 id 聚拢成的 bucket 列表，每个 bucket 内部的 groups 已按时间倒序排好。
   * 空数组时显示空态。
   */
  buckets: { id: string | number; groups: HistoryBucketGroup<T>[] }[];
  /**
   * 共享的折叠状态表（key -> 是否展开），由顶层 panel 统一维护。
   * key 形如 `${prefix}-${id}-${组内首步 index}`——以稳定的 step 索引而非展示位置标识分组，
   * 这样历史数据更新后已展开的分组状态仍能正确保持。
   */
  expanded: Record<string, boolean>;
}>();

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
  /** 用户点击"清空"按钮，请求清空该类（数据源 / 代码块）的全部历史记录（由上层弹窗二次确认后执行）。 */
  (_e: 'clear'): void;
}>();
</script>
