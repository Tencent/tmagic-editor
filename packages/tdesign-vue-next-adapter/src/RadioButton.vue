<template>
  <TRadioButton :value="value" :disabled="disabled" @click="clickHandler">
    <template #default v-if="$slots.default"> <slot></slot> </template>
  </TRadioButton>
</template>

<script lang="ts" setup>
import { RadioButton as TRadioButton } from 'tdesign-vue-next';

import type { RadioButtonProps } from '@tmagic/design';

defineOptions({
  name: 'TTDesignAdapterRadioButton',
});

defineProps<RadioButtonProps>();

const emit = defineEmits(['click']);

const clickHandler = () => {
  emit('click');
};
</script>
