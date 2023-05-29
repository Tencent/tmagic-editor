<template>
  <component
    class="tmagic-design-drawer"
    :is="uiComponent.component"
    v-bind="uiProps"
    @open="openHandler"
    @opened="openedHandler"
    @close="closeHandler"
    @closed="closedHandler"
    @update:modelValue="updateModelValue"
  >
    <slot></slot>

    <template #header>
      <slot name="header"></slot>
    </template>

    <template #footer>
      <slot name="footer"></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { DrawerProps } from './types';

defineOptions({
  name: 'TMDrawer',
});

const props = defineProps<DrawerProps>();

const emit = defineEmits(['open', 'opened', 'close', 'closed', 'update:modelValue']);

const uiComponent = getConfig('components').drawer;

const uiProps = computed(() => uiComponent.props(props));

const openHandler = (...args: any[]) => {
  emit('open', ...args);
};
const openedHandler = (...args: any[]) => {
  emit('opened', ...args);
};
const closeHandler = (...args: any[]) => {
  emit('close', ...args);
};
const closedHandler = (...args: any[]) => {
  emit('closed', ...args);
};
const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
