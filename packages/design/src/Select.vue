<template>
  <component
    ref="select"
    :is="uiComponent.component"
    v-bind="uiProps"
    @change="changeHandler"
    @visible-change="visibleHandler"
    @update:modelValue="updateModelValue"
  >
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMSelect">
import { computed, onMounted, ref } from 'vue';

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
  size?: 'mini' | 'small' | 'medium';
}>();

const uiComponent = getConfig('components').select;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['change', 'update:modelValue', 'visibleHandler']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};

const visibleHandler = (v: any) => {
  emit('visibleHandler', v);
};

const scrollbarWrap = ref<HTMLDivElement | undefined>();

onMounted(() => {
  scrollbarWrap.value = select.value?.scrollbar.wrap$;
});

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
