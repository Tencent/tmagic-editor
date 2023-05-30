<template>
  <component class="tmagic-design-option-group" ref="optionGroup" :is="uiComponent" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { getConfig } from './config';
import type { OptionGroupProps } from './types';

defineOptions({
  name: 'TMOptionGroup',
});

const props = defineProps<OptionGroupProps>();

const ui = getConfig('components')?.optionGroup;

const uiComponent = ui?.component || 'el-option-group';

const uiProps = computed(() => ui?.props(props) || props);

const optionGroup = ref<any>();
</script>
