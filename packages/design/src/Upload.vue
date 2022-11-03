<template>
  <component ref="upload" :is="uiComponent.component" v-bind="uiProps" @change="changeHandler"></component>
</template>

<script setup lang="ts" name="TMUpload">
import { computed, ref } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  action?: string;
  autoUpload?: boolean;
}>();

const emit = defineEmits(['change']);

const changeHandler = (...args: any[]) => {
  emit('change', ...args);
};
const uiComponent = getConfig('components').upload;

const uiProps = computed(() => uiComponent.props(props));

const upload = ref<any>();

defineExpose({
  clearFiles(...args: any[]) {
    return upload.value?.clearFiles(...args);
  },
});
</script>
