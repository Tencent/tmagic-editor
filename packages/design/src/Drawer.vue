<template>
  <component
    class="tmagic-design-drawer"
    ref="drawer"
    :is="uiComponent"
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
import { computed, ref } from 'vue';

import { getConfig } from './config';
import type { DrawerProps } from './types';

defineOptions({
  name: 'TMDrawer',
});

const props = defineProps<DrawerProps>();

const emit = defineEmits(['open', 'opened', 'close', 'closed', 'update:modelValue']);

const ui = getConfig('components')?.drawer;

const uiComponent = ui?.component || 'el-drawer';

const uiProps = computed(() => ui?.props(props) || props);

const drawer = ref<any>();

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

defineExpose({
  handleClose: () => {
    if (typeof drawer.value?.handleClose === 'function') {
      return drawer.value.handleClose();
    }
    updateModelValue(false);
  },
});
</script>
