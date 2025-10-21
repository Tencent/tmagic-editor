<template>
  <TCheckbox v-model="checked" :disabled="disabled" :value="value" @change="changeHandler">
    <template #default v-if="$slots.default"> <slot></slot> </template>
  </TCheckbox>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Checkbox as TCheckbox } from 'tdesign-vue-next';

import type { CheckboxProps } from '@tmagic/design';

defineOptions({
  name: 'TTDesignAdapterCheckbox',
});

const props = defineProps<CheckboxProps>();

const emit = defineEmits(['change', 'update:modelValue']);

const checked = ref(false);

watch(
  () => props.modelValue,
  (v) => {
    if (typeof props.trueValue !== 'undefined') {
      checked.value = v === props.trueValue;
    } else if (typeof props.falseValue !== 'undefined') {
      checked.value = v !== props.falseValue;
    } else {
      checked.value = Boolean(v);
    }
  },
  {
    immediate: true,
  },
);

const changeHandler = (v: boolean) => {
  updateModelValue(v);
  emit('change', v ? (props.trueValue ?? true) : (props.falseValue ?? false));
};

const updateModelValue = (v: boolean) => {
  emit('update:modelValue', v ? (props.trueValue ?? true) : (props.falseValue ?? false));
};
</script>
