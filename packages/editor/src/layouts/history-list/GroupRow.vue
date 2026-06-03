<template>
  <li
    class="m-editor-history-list-item m-editor-history-list-group"
    :class="{ 'is-undone': !applied, 'is-merged': merged, 'is-current': isCurrent }"
  >
    <div
      class="m-editor-history-list-group-head"
      :class="{ 'is-clickable': isHeadClickable }"
      :title="headTitle"
      @click="onHeadClick"
    >
      <span class="m-editor-history-list-item-index" :title="headIndexTitle">{{ headIndexLabel }}</span>
      <span class="m-editor-history-list-item-op" :class="`op-${opType}`">{{ opLabel(opType) }}</span>
      <span class="m-editor-history-list-item-desc">{{ desc }}</span>

      <span v-if="time" class="m-editor-history-list-item-time" :title="timeTitle || time">{{ time }}</span>

      <span v-if="merged" class="m-editor-history-list-item-merge">合并 {{ stepCount }} 步</span>

      <span
        v-if="!merged && headRevertable"
        class="m-editor-history-list-item-revert"
        title="将该步骤的修改作为一次新操作反向应用（不影响后续历史）"
        @click.stop="onRevertClick(subSteps[0].index)"
        >回滚</span
      >
      <span
        v-if="!merged && gotoEnabled && !isCurrent && subSteps.length"
        class="m-editor-history-list-item-goto"
        title="回到该记录"
        @click.stop="onGotoClick(subSteps[0].index)"
        >回到</span
      >
      <span
        v-if="!merged && headDiffable"
        class="m-editor-history-list-item-diff"
        title="查看修改差异"
        @click.stop="onDiffClick(subSteps[0].index)"
        >查看差异</span
      >
      <span v-if="merged" class="m-editor-history-list-group-toggle" :class="{ 'is-expanded': expanded }">▾</span>
    </div>

    <ul v-if="merged && expanded" class="m-editor-history-list-substeps">
      <li
        v-for="s in subStepsDisplay"
        :key="s.index"
        :class="{ 'is-undone': !s.applied, 'is-current': s.isCurrent }"
        :title="subStepTitle(s)"
      >
        <span class="m-editor-history-list-item-index">#{{ s.index + 1 }}</span>
        <span class="m-editor-history-list-substep-desc">{{ s.desc }}</span>
        <span v-if="s.time" class="m-editor-history-list-item-time" :title="s.timeTitle || s.time">{{ s.time }}</span>
        <span
          v-if="s.revertable"
          class="m-editor-history-list-item-revert"
          title="将该步骤的修改作为一次新操作反向应用（不影响后续历史）"
          @click.stop="onRevertClick(s.index)"
          >回滚</span
        >
        <span
          v-if="gotoEnabled && !s.isCurrent"
          class="m-editor-history-list-item-goto"
          title="回到该记录"
          @click.stop="onGotoClick(s.index)"
          >回到</span
        >
        <span
          v-if="s.diffable"
          class="m-editor-history-list-item-diff"
          title="查看修改差异"
          @click.stop="onDiffClick(s.index)"
          >查看差异</span
        >
      </li>
    </ul>
  </li>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import type { HistoryOpType } from '@editor/type';

import { opLabel } from './composables';

defineOptions({
  name: 'MEditorHistoryListGroupRow',
});

const props = withDefaults(
  defineProps<{
    /** 唯一标识当前组的 key，作为 toggle 事件的 payload 回传给上层。形如 `pg-${首步 index}` / `ds-${id}-${首步 index}` / `cb-${id}-${首步 index}`，以稳定的 step 索引标识分组。 */
    groupKey: string;
    /** 该组当前是否处于已应用状态（false 表示已被 undo 撤销，UI 会显示为灰态）。 */
    applied: boolean;
    /** 是否为合并组（即组内 step 数大于 1，由多次连续操作合并而来）。决定是否展示合并标记与可展开的子步列表。 */
    merged: boolean;
    /** 操作类型：`add` / `remove` / `update`，用于决定操作徽标的颜色和文案。 */
    opType: HistoryOpType;
    /** 组的整体描述文案，由上层根据 step / group 计算后传入，例如 "修改 button · style.color"。 */
    desc: string;
    /** 组头部展示的时间文案（一般为组内最近一步的时间），为空时不渲染。 */
    time?: string;
    /** 组头部时间的 title 悬浮提示（完整时间），缺省时回退为 time。 */
    timeTitle?: string;
    /** 组内的 step 总数，仅在 merged 为 true 时显示为 "合并 N 步"。 */
    stepCount: number;
    /** 子步列表，用于在展开状态下逐条展示每个 step 的索引、应用状态与描述文案。 */
    subSteps: {
      index: number;
      applied: boolean;
      desc: string;
      isCurrent?: boolean;
      diffable?: boolean;
      /** 是否可对该子步执行「回滚」（已应用 + 业务侧确认支持反向）。父级根据 step 与 applied 决定。 */
      revertable?: boolean;
      /** 该子步的时间文案，为空时不渲染。 */
      time?: string;
      /** 该子步时间的 title 悬浮提示（完整时间），缺省时回退为 time。 */
      timeTitle?: string;
    }[];
    /** 当前组是否处于展开状态。仅在 merged 为 true 时生效，控制子步列表是否渲染。 */
    expanded: boolean;
    /** 是否为当前所在的分组（包含栈中最近一次已应用步骤的那一组），UI 高亮展示。 */
    isCurrent?: boolean;
    /**
     * 是否支持「跳转到该记录」(goto)。默认 true。
     * 为 false 时：单步组头部与子步条目都不再可点击跳转、也不会触发 goto 事件，
     * 仅保留合并组头部的展开 / 收起能力，以及查看差异、回滚等其它入口。
     */
    gotoEnabled?: boolean;
  }>(),
  {
    isCurrent: false,
    gotoEnabled: true,
  },
);

const emit = defineEmits<{
  /**
   * 用户点击合并组头部时触发，携带 groupKey；上层用其切换 expanded 状态。
   * 对单步组（非合并）头部点击不会发该事件——因为单步组没有"展开"的概念。
   */
  (_e: 'toggle', _key: string): void;
  /**
   * 用户希望跳转到该记录时触发，携带"目标 step 在所属栈中的索引"——上层据此计算目标 cursor (= index + 1)。
   * 触发场景：
   * - 单步组（merged=false）头部：取该唯一 step 的 index；
   * - 子步条目：取该子步的 index。
   * 合并组头部不再触发 goto，避免与展开/收起冲突；用户应展开后点具体子步精准跳转。
   * 当前所在的步骤（isCurrent）始终不会触发 goto。
   */
  (_e: 'goto', _index: number): void;
  /**
   * 用户希望查看该 step 的修改差异（旧值 vs 新值）。
   * 只在 step 满足"前后值都存在"（如 update / 数据源、代码块的 update）时由父级标记 `diffable=true`。
   * payload 为该 step 在所属栈中的索引，由上层根据 index 取 step 内容并展示对比。
   */
  (_e: 'diff-step', _index: number): void;
  /**
   * 用户希望「回滚」该 step——把它的修改作为一次新操作反向应用（类 git revert）。
   * payload 为该 step 在所属栈中的索引。仅在单步组头部（headRevertable）或合并组的可回滚子步上触发。
   */
  (_e: 'revert-step', _index: number): void;
}>();

/**
 * 仅合并组头部可点击（切换展开 / 收起）；
 * 单步组的跳转改由头部的「回退」按钮触发，整行不再可点击。
 */
const isHeadClickable = computed(() => props.merged);

const headTitle = computed(() => {
  if (props.merged) return props.expanded ? '点击收起子步' : '点击展开子步';
  if (props.isCurrent) return '当前所在记录';
  return '';
});

/**
 * 头部点击行为：仅合并组切换展开 / 收起；单步组不再响应整行点击。
 */
const onHeadClick = () => {
  if (props.merged) {
    emit('toggle', props.groupKey);
  }
};

const onGotoClick = (index: number) => {
  if (!props.gotoEnabled) return;
  emit('goto', index);
};

const subStepTitle = (s: { isCurrent?: boolean }) => {
  if (s.isCurrent) return '当前所在记录';
  return '';
};

/** 单步组头部是否展示"查看差异"入口：要求该唯一子步本身可对比。 */
const headDiffable = computed(() => !props.merged && Boolean(props.subSteps[0]?.diffable));

/** 单步组头部是否展示"回滚"入口：要求该唯一子步本身可回滚（已应用）。 */
const headRevertable = computed(() => !props.merged && Boolean(props.subSteps[0]?.revertable));

/**
 * 合并组展开后的子步渲染顺序：与外层分组列表保持一致——倒序展示（最新的子步在最上方）。
 * 外层 page tab / bucket 都已对 groups 做了 reverse，子步沿用同样的视觉规则更直观。
 * 注意：仅用于渲染，原 `subSteps` 保持时间正序，`headIndexLabel` 等基于首尾索引的展示语义不变。
 */
const subStepsDisplay = computed(() => props.subSteps.slice().reverse());

/**
 * 头部索引展示：
 * - 单步组（merged=false）：显示该唯一 step 的编号，如 `#5`；
 * - 合并组：显示组内 step 的编号范围，如 `#3-#7`（首尾相同则退化为 `#5`）。
 *
 * 这里展示的是 step.index + 1（与子步列表 `#{{ s.index + 1 }}` 保持一致），从 1 起编号更符合直觉。
 */
const headIndexLabel = computed(() => {
  const list = props.subSteps;
  if (!list.length) return '';
  const first = list[0].index + 1;
  const last = list[list.length - 1].index + 1;
  if (!props.merged || first === last) return `#${first}`;
  return `#${first}-#${last}`;
});

const headIndexTitle = computed(() => {
  if (!props.merged) return `历史步骤编号 #${props.subSteps[0]?.index + 1}`;
  return `合并了第 ${props.subSteps[0]?.index + 1} 至第 ${
    props.subSteps[props.subSteps.length - 1]?.index + 1
  } 共 ${props.subSteps.length} 条历史步骤`;
});

const onDiffClick = (index: number) => {
  emit('diff-step', index);
};

const onRevertClick = (index: number) => {
  emit('revert-step', index);
};
</script>
