<template>
  <TRadio :value="value" @click="clickHandler">
    <template #default v-if="$slots.default"> <slot></slot> </template>
  </TRadio>
</template>

<script lang="ts" setup>
import { Radio as TRadio } from 'tdesign-vue-next';

import type { RadioProps } from '@tmagic/design';

defineOptions({
  name: 'TTDesignAdapterRadio',
});

defineProps<RadioProps>();

const emit = defineEmits(['click']);

const clickHandler = () => {
  emit('click');
};
</script>
