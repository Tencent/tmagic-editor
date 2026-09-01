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
      </div>
      <MGroupList
        :config="eventConfig"
        :name="name"
        :disabled="disabled"
        :model="model"
        :last-values="lastValues"
        :is-compare="isCompareMode"
        :prop="prop"
        :size="size"
        @change="onChangeHandler"
      >
        <template #title="{ model: itemModel, lastValues: itemLastValues, prop: itemProp }">
          <div class="event-item-header">
            <MFormContainer
              class="fullWidth"
              :config="eventNameConfig"
              :model="itemModel"
              :last-values="itemLastValues"
              :is-compare="isCompareMode"
              :disabled="disabled"
              :size="size"
              :prop="itemProp"
              @change="onChangeHandler"
            ></MFormContainer>
          </div>
        </template>
      </MGroupList>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import type { ContainerChangeEventData, EventSelectConfig, FieldProps } from '@tmagic/form';
import { MContainer as MFormContainer, MGroupList, MTable } from '@tmagic/form';

import {
  createEventNameConfig,
  createEventSelectConfig,
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

const tableConfig = computed(() => createLegacyTableConfig(props.config));

const eventNameConfig = computed(() => createEventNameConfig(props.config));

const eventConfig = computed(() => createEventSelectConfig(props.config, props.name));

const isOldVersion = computed(() => isLegacyEventValue(props.model[props.name]));

/**
 * 对比模式判定：
 *
 * event-select 内部是事件列表 group-list。父级 `MFormContainer` 已将其归入「自接管对比字段」
 * （见 Container.vue 的 `SELF_DIFF_FIELD_TYPES`），对比时只渲染一次本组件，并把 `is-compare` /
 * `lastValues` 透传给内部 MGroupList 与 title slot 里的事件名表单。
 *
 * 仅当存在历史值时才启用对比，避免 lastValues 缺失时退化为「全部新增」的空对比。
 */
const isCompareMode = computed(() => Boolean(props.isCompare && props.lastValues));

const onChangeHandler = (_v: any, eventData?: ContainerChangeEventData) =>
  emit('change', props.model[props.name], eventData);
</script>
