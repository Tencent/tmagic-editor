<template>
  <component
    class="tmagic-design-select"
    ref="select"
    :is="uiComponent"
    v-bind="uiProps"
    @change="changeHandler"
    @visible-change="visibleHandler"
    @popup-visible-change="visibleHandler"
    @update:modelValue="updateModelValue"
  >
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

import { getConfig } from './config';
import type { SelectProps } from './types';

defineOptions({
  name: 'TMSelect',
});

const props = defineProps<SelectProps>();

const emit = defineEmits(['change', 'update:modelValue', 'visibleHandler']);

const ui = getConfig('components')?.select;

const uiComponent = ui?.component || 'el-select';

const uiProps = computed(() => ui?.props(props) || props);

const select = ref<any>();

const changeHandler = (...args: any[]) => {
  emit('change', ...args);
};

const updateModelValue = (...args: any[]) => {
  emit('update:modelValue', ...args);
};

const visibleHandler = (...args: any[]) => {
  emit('visibleHandler', ...args);
};

const scrollbarWrap = ref<HTMLDivElement | undefined>();

const unWatch = watch(
  () => select.value?.scrollbar?.wrap$ || select.value?.scrollbar?.wrapRef,
  (wrap) => {
    if (!wrap) {
      return;
    }

    nextTick(() => unWatch());

    scrollbarWrap.value = wrap;
  },
  {
    immediate: true,
  },
);

defineExpose({
  scrollbarWrap,

  setQuery(v: string) {
    if (!select.value) return;
    select.value.query = v;
  },

  setPreviousQuery(v: string) {
    if (!select.value) return;
    select.value.previousQuery = v;
  },

  setSelectedLabel(v: string) {
    if (!select.value) return;
    select.value.selectedLabel = v;
  },

  setSelected() {
    if (!select.value) return;
    return select.value.setSelected();
  },
});
</script>
