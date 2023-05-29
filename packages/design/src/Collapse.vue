<template>
  <component
    class="tmagic-design-collapse"
    :is="uiComponent.component"
    v-bind="uiProps"
    @update:modelValue="updateModelValue"
    @change="changeHandler"
  >
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { CollapseProps } from './types';

defineOptions({
  name: 'TMCollapse',
});

const props = defineProps<CollapseProps>();

const uiComponent = getConfig('components').collapse;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
