<template>
  <div class="m-fields-event-select">
    <MTable
      v-if="isOldVersion"
      name="events"
      :size="size"
      :disabled="disabled"
      :model="model"
      :last-values="lastValues"
      :is-compare="isCompareMode"
      :config="tableConfig"
      @change="onChangeHandler"
    ></MTable>

    <div v-else class="fullWidth event-select-container">
      <div class="event-select-header">
        <div class="event-select-title">事件配置</div>
        <TMagicButton
          v-if="!isCompareMode && displayList.length > 0"
          class="create-button"
          text
          type="primary"
          :icon="Plus"
          :size="size"
          :disabled="disabled"
          @click="addEvent()"
          >添加事件</TMagicButton
        >
      </div>
      <MPanel
        v-for="entry in displayList"
        :key="entry.index"
        :disabled="disabled"
        :size="size"
        :prop="`${prop}.${entry.index}`"
        :config="actionsConfig"
        :model="entry.cardItem"
        :last-values="entry.lastCardItem"
        :is-compare="isCompareMode"
        :hide-expand="false"
        :label-width="config.labelWidth || '100px'"
        @change="onChangeHandler"
      >
        <template #header>
          <div class="event-item-header">
            <MFormContainer
              class="fullWidth"
              :config="eventNameConfig"
              :model="entry.cardItem"
              :last-values="entry.lastCardItem"
              :is-compare="isCompareMode"
              :disabled="disabled"
              :size="size"
              :prop="`${prop}.${entry.index}`"
              @change="eventNameChangeHandler"
            ></MFormContainer>
            <TMagicButton
              class="event-item-delete-button"
              v-if="!isCompareMode"
              link
              :icon="Delete"
              :disabled="disabled"
              :size="size"
              @click="removeEvent(Number(entry.index))"
            ></TMagicButton>
          </div>
        </template>
      </MPanel>

      <TMagicButton
        v-if="!isCompareMode"
        class="create-button fullWidth"
        :icon="Plus"
        :disabled="disabled"
        @click="addEvent()"
        >添加事件</TMagicButton
      >
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Delete } from '@element-plus/icons-vue';
import { Plus } from '@element-plus/icons-vue';

import { TMagicButton } from '@tmagic/design';
import type { ContainerChangeEventData, EventSelectConfig, FieldProps } from '@tmagic/form';
import { MContainer as MFormContainer, MPanel, MTable } from '@tmagic/form';

import {
  createActionsConfig,
  createEventNameConfig,
  createLegacyTableConfig,
  isLegacyEventValue,
} from '@editor/fields/configs/eventSelect';

defineOptions({
  name: 'MFieldsEventSelect',
});

const props = defineProps<FieldProps<EventSelectConfig>>();

const emit = defineEmits<{
  change: [v: any, eventData?: ContainerChangeEventData];
}>();

// 事件名称下拉框表单配置
const eventNameConfig = computed(() => createEventNameConfig(props.config));

// 兼容旧的数据格式
const tableConfig = computed(() => createLegacyTableConfig(props.config));

// 组件动作组表单配置
const actionsConfig = computed(() => createActionsConfig(props.config));

// 是否为旧的数据格式
const isOldVersion = computed(() => isLegacyEventValue(props.model[props.name]));

/**
 * 对比模式判定：
 *
 * event-select 内部由「事件列表 + 嵌套子表单」组成，属于复合字段。父级 `MFormContainer` 已将其
 * 归入「自接管对比字段」（见 Container.vue 的 `SELF_DIFF_FIELD_TYPES`），即对比时只渲染一次本组件，
 * 并把当前值 `model` 与历史值 `lastValues` 一并传入，由本组件把 `is-compare`/`lastValues` 透传给
 * 内部的 MPanel / MFormContainer，逐项（事件名、动作）展示前后差异。
 *
 * 仅当存在历史值时才启用对比，避免 lastValues 缺失时退化为「全部新增」的空对比。
 */
const isCompareMode = computed(() => Boolean(props.isCompare && props.lastValues));

/**
 * 待渲染的事件卡片列表。
 *
 * - 非对比模式：直接映射当前事件列表，`lastCardItem` 为空；
 * - 对比模式：按索引对齐当前值与历史值，取两者长度的最大值，使得「新增」（仅当前有）与
 *   「删除」（仅历史有）的事件都能被渲染出来；缺失的一侧用空对象兜底，从而让子级正确高亮差异。
 */
const displayList = computed<{ cardItem: any; lastCardItem: any; index: number }[]>(() => {
  const current = props.model[props.name] || [];

  if (!isCompareMode.value) {
    return current.map((cardItem: any, index: number) => ({ cardItem, lastCardItem: undefined, index }));
  }

  const last = props.lastValues?.[props.name] || [];
  const length = Math.max(current.length, last.length);

  return Array.from({ length }, (_, index) => ({
    cardItem: current[index] ?? {},
    lastCardItem: last[index] ?? {},
    index,
  }));
});

// 添加事件
const addEvent = () => {
  const defaultEvent = {
    name: '',
    actions: [],
  };

  if (!props.model[props.name]) {
    props.model[props.name] = [];
  }

  emit('change', defaultEvent, {
    modifyKey: props.model[props.name].length,
  });
};

// 删除事件
const removeEvent = (index: number) => {
  if (!props.name) return;
  props.model[props.name].splice(index, 1);
  emit('change', props.model[props.name]);
};

const eventNameChangeHandler = (v: any, eventData: ContainerChangeEventData) => {
  emit('change', props.model[props.name], eventData);
};

const onChangeHandler = (v: any, eventData: ContainerChangeEventData) =>
  emit('change', props.model[props.name], eventData);
</script>
