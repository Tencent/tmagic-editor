<template>
  <component
    class="tmagic-design-select"
    ref="select"
    :is="uiComponent.component"
    v-bind="uiProps"
    @change="changeHandler"
    @visible-change="visibleHandler"
    @popup-visible-change="visibleHandler"
    @update:modelValue="updateModelValue"
  >
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMSelect">
import { computed, ref, watch } from 'vue';

import { getConfig } from './config';

const select = ref<any>();

const props = defineProps<{
  modelValue?: any;
  clearable?: boolean;
  filterable?: boolean;
  popperClass?: string;
  disabled?: boolean;
  placeholder?: string;
  remote?: boolean;
  multiple?: boolean;
  allowCreate?: boolean;
  valueKey?: string;
  remoteMethod?: any;
  size?: 'large' | 'default' | 'small';
}>();

const uiComponent = getConfig('components').select;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['change', 'update:modelValue', 'visibleHandler']);

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

const unWacth = watch(
  () => select.value?.scrollbar?.wrap$ || select.value?.scrollbar?.wrapRef,
  (wrap) => {
    if (!wrap) {
      return;
    }
    scrollbarWrap.value = wrap;
    unWacth();
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
