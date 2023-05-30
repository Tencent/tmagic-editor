<template>
  <component class="tmagic-design-dropdown-item" :is="uiComponent" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { DropdownItemProps } from './types';

defineOptions({
  name: 'TMDropdownItem',
});

const props = defineProps<DropdownItemProps>();

const ui = getConfig('components')?.dropdownItem;

const uiComponent = ui?.component || 'el-dropdown-item';

const uiProps = computed(() => ui?.props(props) || props);
</script>
