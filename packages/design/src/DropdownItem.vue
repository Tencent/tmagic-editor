<template>
  <component class="tmagic-design-dropdown-item" :is="uiComponent.component" v-bind="uiProps">
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

const uiComponent = getConfig('components').dropdownItem;

const uiProps = computed(() => uiComponent.props(props));
</script>
