<template>
  <component :is="uiComponent.component" v-bind="uiProps" @change="changeHandler" @update:modelValue="updateModelValue">
  </component>
</template>

<script setup lang="ts" name="TMDatePicker">
import { computed } from 'vue';

import { getConfig } from './config';

const props = withDefaults(
  defineProps<{
    type?: string;
    modelValue?: any;
    disabled?: boolean;
    placeholder?: string;
    rangeSeparator?: string;
    startPlaceholder?: string;
    endPlaceholder?: string;
    format?: string;
    /** 可选，绑定值的格式。 不指定则绑定值为 Date 对象 */
    valueFormat?: string;
    /** 在范围选择器里取消两个日期面板之间的联动 */
    unlinkPanels?: boolean;
    defaultTime?: any;
    size?: 'mini' | 'small' | 'medium';
  }>(),
  {
    type: 'date',
  },
);

const uiComponent = getConfig('components').datePicker;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
