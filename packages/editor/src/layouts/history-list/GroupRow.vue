<template>
  <li
    class="m-editor-history-list-item m-editor-history-list-group"
    :class="{ 'is-undone': !group.applied, 'is-merged': merged, 'is-current': group.isCurrent }"
  >
    <div
      class="m-editor-history-list-group-head"
      :class="{ 'is-clickable': isHeadClickable }"
      :title="headTitle"
      @click="onHeadClick"
    >
      <span class="m-editor-history-list-item-index" :title="headIndexTitle">{{ headIndexLabel }}</span>
      <span class="m-editor-history-list-item-op" :class="`op-${group.opType}`">{{ opLabel(group.opType) }}</span>
      <span class="m-editor-history-list-item-desc">{{ group.desc }}</span>

      <span v-if="headSaved" class="m-editor-history-list-item-saved" title="该记录为最近一次保存的状态">已保存</span>

      <span
        v-if="!merged && (headRevertable || headDiffable || canHeadGoto)"
        class="m-editor-history-list-item-actions"
      >
        <span
          v-if="headRevertable"
          class="m-editor-history-list-item-revert"
          title="将该步骤的修改作为一次新操作反向应用（不影响后续历史）"
          @click.stop="onRevertClick(group.subSteps[0].index)"
          >回滚</span
        >
        <span
          v-if="canHeadGoto"
          class="m-editor-history-list-item-goto"
          title="回到该记录"
          @click.stop="onGotoClick(group.subSteps[0].index)"
          >回到</span
        >
        <span
          v-if="headDiffable"
          class="m-editor-history-list-item-diff"
          title="查看修改差异"
          @click.stop="onDiffClick(group.subSteps[0].index)"
          >查看差异</span
        >
      </span>

      <span
        v-if="!merged && sourceLabel(group.source)"
        class="m-editor-history-list-item-source"
        :title="`操作途径：${sourceLabel(group.source)}`"
        >{{ sourceLabel(group.source) }}</span
      >

      <span
        v-if="!merged && group.operator"
        class="m-editor-history-list-item-operator"
        :title="`操作人：${group.operator}`"
        >{{ group.operator }}</span
      >

      <span
        v-if="!merged && group.time"
        class="m-editor-history-list-item-time"
        :title="group.timeTitle || group.time"
        >{{ group.time }}</span
      >

      <span v-if="merged" class="m-editor-history-list-item-merge">合并 {{ stepCount }} 步</span>
      <span v-if="merged" class="m-editor-history-list-group-toggle" :class="{ 'is-expanded': expanded }">▾</span>
    </div>

    <ul v-if="merged && expanded" class="m-editor-history-list-substeps">
      <li
        v-for="s in subStepsDisplay"
        :key="s.index"
        :class="{ 'is-undone': !s.applied, 'is-current': s.isCurrent, 'is-clickable': selectEnabled }"
        :title="subStepTitle(s)"
        @click="onSubStepClick(s.index)"
      >
        <span class="m-editor-history-list-item-index">#{{ s.index + 1 }}</span>
        <span class="m-editor-history-list-substep-desc">{{ s.desc }}</span>
        <span v-if="s.saved" class="m-editor-history-list-item-saved" title="该记录为最近一次保存的状态">已保存</span>
        <span
          v-if="s.revertable || s.diffable || (gotoEnabled && !s.isCurrent)"
          class="m-editor-history-list-item-actions"
        >
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
        </span>
        <span
          v-if="sourceLabel(s.source)"
          class="m-editor-history-list-item-source"
          :title="`操作途径：${sourceLabel(s.source)}`"
          >{{ sourceLabel(s.source) }}</span
        >
        <span v-if="s.operator" class="m-editor-history-list-item-operator" :title="`操作人：${s.operator}`">{{
          s.operator
        }}</span>
        <span v-if="s.time" class="m-editor-history-list-item-time" :title="s.timeTitle || s.time">{{ s.time }}</span>
      </li>
    </ul>
  </li>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import type { HistoryRowGroup, HistoryRowStep } from './composables';
import { opLabel, sourceLabel } from './composables';

defineOptions({
  name: 'MEditorHistoryListGroupRow',
});

const props = withDefaults(
  defineProps<{
    /**
     * 该组的视图模型（由 `toRowGroup` 统一派生）：包含 key、应用状态、操作类型、描述、
     * 来源 / 时间等头部信息以及子步列表。原先散落的十余个扁平 props 收敛于此单一对象。
     */
    group: HistoryRowGroup;
    /** 当前组是否处于展开状态（合并组默认展开）。仅在合并组（子步数 > 1）时生效，控制子步列表是否渲染。 */
    expanded: boolean;
    /**
     * 是否支持「跳转到该记录」(goto)。默认 true。
     * 为 false 时：单步组头部与子步条目都不再可点击跳转、也不会触发 goto 事件，
     * 仅保留合并组头部的展开 / 收起能力，以及查看差异、回滚等其它入口。
     */
    gotoEnabled?: boolean;
    /**
     * 是否支持「点击记录选中对应节点」。默认 false（仅页面 tab 启用，数据源 / 代码块无节点概念）。
     * 为 true 时：点击单步组头部、子步条目或合并组头部都会发出 `select` 事件（携带对应 step 索引），
     * 由上层解析出节点 id 并在画布选中；合并组头部同时保留展开 / 收起能力。
     */
    selectEnabled?: boolean;
  }>(),
  {
    gotoEnabled: true,
    selectEnabled: false,
  },
);

const emit = defineEmits<{
  /**
   * 用户点击合并组头部时触发，携带 group.key；上层用其切换 expanded 状态。
   * 对单步组（非合并）头部点击不会发该事件——因为单步组没有"展开"的概念。
   */
  (_e: 'toggle', _key: string): void;
  /**
   * 用户希望跳转到该记录时触发，携带"目标 step 在所属栈中的索引"——上层据此计算目标 cursor (= index + 1)。
   * 触发场景：
   * - 单步组（非合并）头部：取该唯一 step 的 index；
   * - 子步条目：取该子步的 index。
   * 合并组头部不再触发 goto，避免与展开/收起冲突；用户应展开后点具体子步精准跳转。
   * 当前所在的步骤（isCurrent）始终不会触发 goto。
   */
  (_e: 'goto', _index: number): void;
  /**
   * 用户希望查看该 step 的修改差异（旧值 vs 新值）。
   * 只在 step 满足"前后值都存在"（如 update / 数据源、代码块的 update）时由 `toRowGroup` 标记 `diffable=true`。
   * payload 为该 step 在所属栈中的索引，由上层根据 index 取 step 内容并展示对比。
   */
  (_e: 'diff-step', _index: number): void;
  /**
   * 用户希望「回滚」该 step——把它的修改作为一次新操作反向应用（类 git revert）。
   * payload 为该 step 在所属栈中的索引。仅在单步组头部（headRevertable）或合并组的可回滚子步上触发。
   */
  (_e: 'revert-step', _index: number): void;
  /**
   * 用户希望「选中该记录对应的节点」。payload 为该 step 在所属栈中的索引，
   * 由上层据 index 取出 step、解析出节点 id 并在画布选中。仅在 `selectEnabled` 为 true 时触发。
   */
  (_e: 'select', _index: number): void;
}>();

/** 子步数大于 1 即为合并组：决定是否展示合并标记与可展开的子步列表。 */
const merged = computed(() => props.group.subSteps.length > 1);

/** 组内 step 总数，仅在合并组时显示为 "合并 N 步"。 */
const stepCount = computed(() => props.group.subSteps.length);

/**
 * 头部可点击的场景：
 * - 合并组：点击切换展开 / 收起；
 * - 开启 `selectEnabled`（页面 tab）：点击选中对应节点。
 * 单步组的跳转仍由头部的「回到」按钮触发。
 */
const isHeadClickable = computed(() => merged.value || props.selectEnabled);

const headTitle = computed(() => {
  if (merged.value) {
    const expandHint = props.expanded ? '点击收起子步' : '点击展开子步';
    return props.selectEnabled ? `${expandHint}（并选中该节点）` : expandHint;
  }
  if (props.selectEnabled) return '点击选中该节点';
  if (props.group.isCurrent) return '当前所在记录';
  return '';
});

/**
 * 头部点击行为：
 * - 开启 selectEnabled 时，发出 select（携带组内首步 index，上层据此选中节点）；
 * - 合并组同时切换展开 / 收起。
 */
const onHeadClick = () => {
  if (props.selectEnabled && props.group.subSteps.length) {
    emit('select', props.group.subSteps[0].index);
  }
  if (merged.value) {
    emit('toggle', props.group.key);
  }
};

const onGotoClick = (index: number) => {
  if (!props.gotoEnabled) return;
  emit('goto', index);
};

/** 点击子步行：开启 selectEnabled 时选中该子步对应的节点。 */
const onSubStepClick = (index: number) => {
  if (!props.selectEnabled) return;
  emit('select', index);
};

const subStepTitle = (s: { isCurrent?: boolean }) => {
  if (props.selectEnabled) return '点击选中该节点';
  if (s.isCurrent) return '当前所在记录';
  return '';
};

/**
 * 头部是否展示「已保存」标记：
 * - 单步组：取该唯一子步的 saved；
 * - 合并组：组内任一子步为已保存即在头部提示（具体落在哪一步可展开查看）。
 */
const headSaved = computed(() =>
  merged.value ? props.group.subSteps.some((s) => s.saved) : Boolean(props.group.subSteps[0]?.saved),
);

/** 单步组头部是否展示"查看差异"入口：要求该唯一子步本身可对比。 */
const headDiffable = computed(() => !merged.value && Boolean(props.group.subSteps[0]?.diffable));

/** 单步组头部是否展示"回滚"入口：要求该唯一子步本身可回滚（已应用）。 */
const headRevertable = computed(() => !merged.value && Boolean(props.group.subSteps[0]?.revertable));

/** 单步组头部是否展示"回到"入口：可跳转、非当前、且存在唯一子步。 */
const canHeadGoto = computed(
  () => !merged.value && props.gotoEnabled && !props.group.isCurrent && props.group.subSteps.length > 0,
);

/**
 * 合并组展开后的子步渲染顺序：与外层分组列表保持一致——倒序展示（最新的子步在最上方）。
 * 外层 page tab / bucket 都已对 groups 做了 reverse，子步沿用同样的视觉规则更直观。
 * 注意：仅用于渲染，原 `subSteps` 保持时间正序，`headIndexLabel` 等基于首尾索引的展示语义不变。
 */
const subStepsDisplay = computed<HistoryRowStep[]>(() => props.group.subSteps.slice().reverse());

/**
 * 头部索引展示：
 * - 单步组（非合并）：显示该唯一 step 的编号，如 `#5`；
 * - 合并组：显示组内 step 的编号范围，如 `#3-#7`（首尾相同则退化为 `#5`）。
 *
 * 这里展示的是 step.index + 1（与子步列表 `#{{ s.index + 1 }}` 保持一致），从 1 起编号更符合直觉。
 */
const headIndexLabel = computed(() => {
  const list = props.group.subSteps;
  if (!list.length) return '';
  const first = list[0].index + 1;
  const last = list[list.length - 1].index + 1;
  if (!merged.value || first === last) return `#${first}`;
  return `#${first}-#${last}`;
});

const headIndexTitle = computed(() => {
  const list = props.group.subSteps;
  if (!merged.value) return `历史步骤编号 #${list[0]?.index + 1}`;
  return `合并了第 ${list[0]?.index + 1} 至第 ${list[list.length - 1]?.index + 1} 共 ${list.length} 条历史步骤`;
});

const onDiffClick = (index: number) => {
  emit('diff-step', index);
};

const onRevertClick = (index: number) => {
  emit('revert-step', index);
};
</script>
