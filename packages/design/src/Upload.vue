<template>
  <component
    class="tmagic-design-upload"
    ref="upload"
    :is="uiComponent"
    v-bind="uiProps"
    @change="changeHandler"
  ></component>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { getConfig } from './config';
import type { UploadProps } from './types';

defineOptions({
  name: 'TMUpload',
});

const props = defineProps<UploadProps>();

const emit = defineEmits(['change']);

const changeHandler = (...args: any[]) => {
  emit('change', ...args);
};
const ui = getConfig('components')?.upload;

const uiComponent = ui?.component || 'el-upload';

const uiProps = computed(() => ui?.props(props) || props);

const upload = ref<any>();

defineExpose({
  clearFiles(...args: any[]) {
    return upload.value?.clearFiles(...args);
  },
});
</script>
