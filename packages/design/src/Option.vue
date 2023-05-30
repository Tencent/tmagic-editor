<template>
  <component class="tmagic-design-option" :is="uiComponent" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { OptionProps } from './types';

defineOptions({
  name: 'TMOption',
});

const props = defineProps<OptionProps>();

const ui = getConfig('components')?.option;

const uiComponent = ui?.component || 'el-option';

const uiProps = computed(() => ui?.props(props) || props);
</script>
