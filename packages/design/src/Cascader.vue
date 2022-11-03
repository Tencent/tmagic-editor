<template>
  <component
    ref="cascader"
    :is="uiComponent.component"
    v-bind="uiProps"
    @update:modelValue="updateModelValue"
    @change="changeHandler"
  ></component>
</template>

<script setup lang="ts" name="TMCascader">
import { computed, ref } from 'vue';

import { getConfig } from './config';
import { CascaderOption } from './type';

const props = defineProps<{
  modelValue?: any;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  filterable?: boolean;
  options?: CascaderOption[];
  size?: 'mini' | 'small' | 'medium';
  props: {
    expandTrigger?: 'click' | 'hover';
    multiple?: boolean;
    checkStrictly?: boolean;
    emitPath?: boolean;
    lazy?: boolean;
  };
}>();

const uiComponent = getConfig('components').cascader;

const uiProps = computed(() => uiComponent.props(props));

const cascader = ref<any>();

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};

defineExpose({
  setQuery(v: any) {
    if (!cascader.value) return;
    cascader.value.query = v;
  },

  setPreviousQuery(v: any) {
    if (!cascader.value) return;
    cascader.value.previousQuery = v;
  },
});
</script>
