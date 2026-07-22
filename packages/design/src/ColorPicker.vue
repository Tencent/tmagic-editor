<template>
  <component
    class="tmagic-design-color-picker"
    :is="uiComponent"
    v-bind="uiProps"
    @change="changeHandler"
    @update:modelValue="updateModelValue"
  >
  </component>
  <MInput
    v-if="isFlat && !isLargeStageContainer"
    @update:modelValue="updateModelValue"
    @change="changeHandler"
    v-bind="uiProps"
    class="tmagic-design-color-picker-input"
    clearable
  ></MInput>
</template>

<script setup lang="ts">
import { computed, type ComputedRef, inject } from 'vue';

import { getDesignConfig } from './config';
import { isGlobalFlat } from './index';
import MInput from './Input.vue';
import type { ColorPickerProps } from './types';

defineOptions({
  name: 'TMColorPicker',
});

const isFlat = computed(() => !!props.flat || isGlobalFlat.value);

// 祖先 `<MEditor>` 用 computed 包着 provide，值会随 props.isLargeStageContainer 变化。
// 类型标成 `ComputedRef<boolean>`，模板里 `<script setup>` 自动解包，仍可直接写
// `!isLargeStageContainer`；默认值也得包成 computed，保持形状一致，避免祖先没提供时
// 模板里对一个裸 `false` 和 `ComputedRef` 走两条不同的取值路径。
const isLargeStageContainer = inject<ComputedRef<boolean>>(
  'isLargeStageContainer',
  computed(() => false),
);

const props = withDefaults(defineProps<ColorPickerProps>(), {
  showAlpha: false,
  disabled: false,
});

const ui = getDesignConfig('components')?.colorPicker;

const uiComponent = ui?.component || 'el-color-picker';

const uiProps = computed<ColorPickerProps>(() => ui?.props(props) || props);

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
