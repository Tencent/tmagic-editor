<template>
  <TTabs
    :model-value="modelValue"
    :addable="editable"
    :theme="type === 'card' ? 'card' : 'normal'"
    :placement="tabPosition"
    @add="onTabAdd"
    @change="tabClickHandler"
    @remove="onTabRemove"
    @update:model-value="updateModelName"
  >
    <template #action v-if="$slots['add-icon']">
      <slot name="add-icon"></slot>
    </template>
    <template #default>
      <slot></slot>
    </template>
  </TTabs>
</template>

<script setup lang="ts">
import { Tabs as TTabs } from 'tdesign-vue-next';

import type { TabsProps } from '@tmagic/design';

defineOptions({
  name: 'TTDesignAdapterTabs',
});

defineProps<TabsProps>();

const emit = defineEmits(['tab-click', 'tab-add', 'tab-remove', 'update:model-value']);

const tabClickHandler = (...args: any[]) => {
  emit('tab-click', ...args);
};

const onTabAdd = (...args: any[]) => {
  emit('tab-add', ...args);
};

const onTabRemove = (...args: any[]) => {
  emit('tab-remove', ...args);
};

const updateModelName = (...args: any[]) => {
  emit('update:model-value', ...args);
};
</script>
