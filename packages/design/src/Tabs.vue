<template>
  <component
    class="tmagic-design-tabs"
    :is="uiComponent"
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

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { TabsProps } from './types';

defineOptions({
  name: 'TMTabs',
});

const props = defineProps<TabsProps>();

const ui = getConfig('components')?.tabs;

const uiComponent = ui?.component || 'el-tabs';

const uiProps = computed(() => ui?.props(props) || props);

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
