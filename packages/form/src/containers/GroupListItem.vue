<template>
  <div class="m-fields-group-list-item">
    <div>
      <TMagicButton link :disabled="disabled" @click="expandHandler">
        <TMagicIcon><CaretBottom v-if="expand" /><CaretRight v-else /></TMagicIcon>{{ title }}
      </TMagicButton>

      <TMagicButton
        v-show="showDelete"
        type="danger"
        size="small"
        link
        :icon="Delete"
        :disabled="disabled"
        @click="removeHandler"
      ></TMagicButton>

      <TMagicButton
        v-if="copyable"
        link
        size="small"
        type="primary"
        :icon="DocumentCopy"
        :disabled="disabled"
        @click="copyHandler"
        >复制</TMagicButton
      >

      <template v-if="movable">
        <TMagicButton
          v-show="index !== 0"
          link
          size="small"
          :disabled="disabled"
          :icon="CaretTop"
          @click="changeOrder(-1)"
          >上移</TMagicButton
        >
        <TMagicButton
          v-show="index !== length - 1"
          link
          size="small"
          :disabled="disabled"
          :icon="CaretBottom"
          @click="changeOrder(1)"
          >下移</TMagicButton
        >
      </template>

      <TMagicPopover
        v-if="config.moveSpecifyLocation"
        trigger="click"
        placement="top"
        width="200"
        :visible="moveSpecifyLocationVisible"
      >
        <template #reference>
          <TMagicButton
            link
            size="small"
            type="primary"
            :icon="Position"
            :disabled="disabled"
            @click="moveSpecifyLocationVisible = true"
            >移动至</TMagicButton
          >
        </template>
        <div>
          <div>
            第<TMagicInputNumber
              style="margin: 0 5px"
              v-model="moveSpecifyLocationIndex"
              size="small"
              :min="1"
              :disabled="disabled"
            ></TMagicInputNumber
            >行
          </div>
          <div style="text-align: right; margin-top: 20px">
            <TMagicButton size="small" text @click="moveSpecifyLocationVisible = false">取消</TMagicButton>
            <TMagicButton size="small" type="primary" @click="moveSpecifyLocationHandler">确认</TMagicButton>
          </div>
        </div>
      </TMagicPopover>

      <span v-if="itemExtra" v-html="itemExtra" class="m-form-tip"></span>
    </div>

    <Container
      v-if="expand"
      :config="rowConfig"
      :model="model"
      :lastValues="lastValues"
      :is-compare="isCompare"
      :labelWidth="labelWidth"
      :prop="`${prop}${prop ? '.' : ''}${String(index)}`"
      :size="size"
      :disabled="disabled"
      @change="changeHandler"
      @addDiffCount="onAddDiffCount()"
    ></Container>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { CaretBottom, CaretRight, CaretTop, Delete, DocumentCopy, Position } from '@element-plus/icons-vue';

import { TMagicButton, TMagicIcon, TMagicInputNumber, TMagicPopover } from '@tmagic/design';

import type { ContainerChangeEventData, FormState, GroupListConfig } from '../schema';
import { filterFunction } from '../utils/form';

import Container from './Container.vue';

defineOptions({
  name: 'MFormGroupListItem',
});

const props = defineProps<{
  model: any;
  lastValues: any;
  isCompare?: boolean;
  groupModel: any[];
  config: GroupListConfig;
  labelWidth?: string;
  prop?: string;
  size?: string;
  index: number;
  disabled?: boolean;
}>();

const emit = defineEmits(['swap-item', 'remove-item', 'change', 'addDiffCount', 'copy-item']);

const mForm = inject<FormState | undefined>('mForm');
const expand = ref(props.config.expandAll || !props.index);

const rowConfig = computed(() => ({
  type: 'row',
  span: props.config.span || 24,
  items: props.config.items,
  labelWidth: props.config.labelWidth,
  [mForm?.keyProp || '__key']: `${props.config[mForm?.keyProp || '__key']}${String(props.index)}`,
}));

const title = computed(() => {
  if (props.config.titleKey && props.model[props.config.titleKey]) {
    return props.model[props.config.titleKey];
  }

  if (props.config.title) {
    return filterFunction(mForm, props.config.title, props);
  }

  const titlePrefix = props.config.titlePrefix || '组';

  return `${titlePrefix} ${String(props.index + 1)}`;
});

const length = computed(() => props.groupModel?.length || 0);

const itemExtra = computed(() => filterFunction(mForm, props.config.itemExtra, props));

const removeHandler = () => emit('remove-item', props.index);

const changeHandler = (v: any, eventData: ContainerChangeEventData) => {
  emit('change', props.model, eventData);
};

const expandHandler = () => {
  expand.value = !expand.value;
};

// 希望支持单行可控制是否显示删除按钮，不会影响现有逻辑
const showDelete = computed(() => {
  const deleteFunc = props.config.delete;
  if (deleteFunc && typeof deleteFunc === 'function') {
    return deleteFunc(props.model, props.index, mForm?.values);
  }
  return true;
});

// 调换顺序
const changeOrder = (offset = 0) => emit('swap-item', props.index, props.index + offset);

const movable = computed(() => {
  const { movable } = props.config;

  // 没有设置时，默认可移动
  if (movable === undefined) return true;
  if (typeof movable === 'function') {
    return movable(mForm, props.index || 0, props.model, props.groupModel);
  }
  return movable;
});

const copyable = computed(() => filterFunction<boolean>(mForm, props.config.copyable, props));
const onAddDiffCount = () => emit('addDiffCount');

const copyHandler = () => {
  emit('copy-item', props.index);
};

const moveSpecifyLocationVisible = ref(false);
const moveSpecifyLocationIndex = ref(1);

const moveSpecifyLocationHandler = () => {
  moveSpecifyLocationVisible.value = false;
  emit('swap-item', props.index, moveSpecifyLocationIndex.value - 1);
};
</script>
