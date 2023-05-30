<template>
  <component
    ref="cascader"
    class="tmagic-design-cascader"
    :is="uiComponent"
    v-bind="uiProps"
    @update:modelValue="updateModelValue"
    @change="changeHandler"
  ></component>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { getConfig } from './config';
import { CascaderProps } from './types';

defineOptions({
  name: 'TMCascader',
});

const props = defineProps<CascaderProps>();

const ui = getConfig('components')?.cascader;

const uiComponent = ui?.component || 'el-cascader';

const uiProps = computed(() => ui?.props(props) || props);

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
