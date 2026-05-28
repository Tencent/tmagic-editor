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
        @goto="(index: number) => $emit('goto', index)"
      />
      <!--
        初始状态项：永远位于列表底部（页面 tab 倒序展示，最底部=最早），
        作为"未修改"零点。当所有 group 都未 applied 时它即为当前位置。
      -->
      <InitialRow :is-current="isInitial" @goto-initial="$emit('goto-initial')" />
    </ul>
  </TMagicScrollbar>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { TMagicScrollbar } from '@tmagic/design';

import type { PageHistoryGroup } from '@editor/type';

import { describePageGroup, describePageStep } from './composables';
import GroupRow from './GroupRow.vue';
import InitialRow from './InitialRow.vue';

defineOptions({
  name: 'MEditorHistoryListPageTab',
});

const props = defineProps<{
  /** 当前活动页面的历史分组列表，已按时间倒序排好（最新一组在最前）。空数组时显示空态。 */
  list: PageHistoryGroup[];
  /** 共享的折叠状态表（key -> 是否展开），由顶层 panel 统一维护。本 tab 使用 `pg-${idx}` 作为 key。 */
  expanded: Record<string, boolean>;
}>();

defineEmits<{
  /** 透传 GroupRow 的 toggle 事件给上层 panel，由其更新 expanded。 */
  (_e: 'toggle', _key: string): void;
  /** 透传 GroupRow 的 goto 事件，携带目标 step 在栈中的索引。 */
  (_e: 'goto', _index: number): void;
  /** 用户点击初始项希望回到未修改的状态（cursor=0）。 */
  (_e: 'goto-initial'): void;
}>();

/**
 * 是否处于"初始状态"——即对应页面历史栈 cursor===0：
 * 当 list 中所有 group 的 applied 都为 false 时即为该状态。
 * 没有任何 group 的情况由外层"暂无操作记录"分支兜底，本计算可以不考虑。
 */
const isInitial = computed(() => props.list.length > 0 && props.list.every((g) => !g.applied));
</script>
