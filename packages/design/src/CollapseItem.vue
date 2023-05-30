<template>
  <component
    class="tmagic-design-collapse-item"
    :is="uiComponent"
    v-bind="uiProps"
    @update:modelValue="updateModelValue"
    @change="changeHandler"
  >
    <slot></slot>
    <template #title>
      <slot name="title"></slot>
    </template>
    <template #header>
      <slot name="title"></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { CollapseItemProps } from './types';

defineOptions({
  name: 'TMCollapseItem',
});

const props = defineProps<CollapseItemProps>();

const ui = getConfig('components')?.collapseItem;

const uiComponent = ui?.component || 'el-collapse-item';

const uiProps = computed(() => ui?.props(props) || props);

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
