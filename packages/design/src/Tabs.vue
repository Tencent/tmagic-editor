<template>
  <component
    :is="uiComponent.component"
    v-bind="uiProps"
    @tab-click="tabClickHandler"
    @tab-add="onTabAdd"
    @tab-remove="onTabRemove"
  >
    <template #default>
      <slot></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  type?: string;
  editable?: boolean;
  tabPosition?: string;
}>();

const uiComponent = getConfig('components').tabs;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['tab-click', 'tab-add', 'tab-remove']);

const tabClickHandler = (...args: any[]) => {
  emit('tab-click', ...args);
};

const onTabAdd = (...args: any[]) => {
  emit('tab-add', ...args);
};

const onTabRemove = (...args: any[]) => {
  emit('tab-remove', ...args);
};
</script>
