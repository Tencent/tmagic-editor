<template>
  <ElFormItem v-bind="itemProps">
    <template #label>
      <slot name="label"></slot>
    </template>
    <slot></slot>
    <div v-if="extra" v-html="extra" class="m-form-tip"></div>
  </ElFormItem>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { FormItemProps } from '@tmagic/design';

defineOptions({
  name: 'TElAdapterFormItem',
});

const props = defineProps<FormItemProps>();

const itemProps = computed(() => {
  const { extra, ...rest } = props;
  return rest;
});
</script>
