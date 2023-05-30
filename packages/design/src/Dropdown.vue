<template>
  <component class="tmagic-design-dropdown" :is="uiComponent" v-bind="uiProps" @command="commandHandler">
    <slot></slot>

    <template #dropdown>
      <slot name="dropdown"></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { DropdownProps } from './types';

defineOptions({
  name: 'TMDropdown',
});

const props = defineProps<DropdownProps>();

const ui = getConfig('components')?.dropdown;

const uiComponent = ui?.component || 'el-dropdown';

const uiProps = computed(() => ui?.props(props) || props);

const emit = defineEmits(['command']);

const commandHandler = (...args: any[]) => {
  emit('command', ...args);
};
</script>
