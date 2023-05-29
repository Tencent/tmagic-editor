<template>
  <component class="tmagic-design-option-group" ref="optionGroup" :is="uiComponent.component" v-bind="uiProps">
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

const uiComponent = getConfig('components').optionGroup;

const uiProps = computed(() => uiComponent.props(props));

const optionGroup = ref<any>();
</script>
