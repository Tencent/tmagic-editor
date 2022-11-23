<template>
  <component
    :is="uiComponent.component"
    v-bind="uiProps"
    @tab-click="tabClickHandler"
    @tab-add="onTabAdd"
    @tab-remove="onTabRemove"
    @update:model-value="updateModelName"
  >
    <template #default>
      <slot></slot>
    </template>
  </component>
</template>

<script setup lang="ts" name="TMTabs">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  type?: string;
  editable?: boolean;
  tabPosition?: string;
  modelValue?: string | number;
}>();

const uiComponent = getConfig('components').tabs;

const uiProps = computed(() => uiComponent.props(props));

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
