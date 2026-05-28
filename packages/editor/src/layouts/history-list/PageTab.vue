<template>
  <div v-if="!list.length" class="m-editor-history-list-empty">暂无操作记录</div>
  <TMagicScrollbar v-else max-height="360px">
    <ul class="m-editor-history-list-ul">
      <GroupRow
        v-for="(group, gIdx) in list"
        :key="`pg-${gIdx}`"
        :group-key="`pg-${gIdx}`"
        :applied="group.applied"
        :merged="group.steps.length > 1"
        :op-type="group.opType"
        :desc="describePageGroup(group)"
        :step-count="group.steps.length"
        :sub-steps="
          group.steps.map((s) => ({
            index: s.index,
            applied: s.applied,
            isCurrent: s.isCurrent,
            desc: describePageStep(s.step),
          }))
        "
        :is-current="group.isCurrent"
        :expanded="!!expanded[`pg-${gIdx}`]"
        @toggle="(key: string) => $emit('toggle', key)"
      />
    </ul>
  </TMagicScrollbar>
</template>

<script lang="ts" setup>
import { TMagicScrollbar } from '@tmagic/design';

import type { PageHistoryGroup } from '@editor/type';

import { describePageGroup, describePageStep } from './composables';
import GroupRow from './GroupRow.vue';

defineOptions({
  name: 'MEditorHistoryListPageTab',
});

defineProps<{
  /** 当前活动页面的历史分组列表，已按时间倒序排好（最新一组在最前）。空数组时显示空态。 */
  list: PageHistoryGroup[];
  /** 共享的折叠状态表（key -> 是否展开），由顶层 panel 统一维护。本 tab 使用 `pg-${idx}` 作为 key。 */
  expanded: Record<string, boolean>;
}>();

defineEmits<{
  /** 透传 GroupRow 的 toggle 事件给上层 panel，由其更新 expanded。 */
  (_e: 'toggle', _key: string): void;
}>();
</script>
