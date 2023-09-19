<template>
  <span ref="target" class="m-editor-resizer" :class="{ 'm-editor-resizer-draging': isDraging }">
    <slot></slot>
  </span>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { OnDrag } from 'gesto';

import { useGetSo } from '@editor/hooks/use-getso';

defineOptions({
  name: 'MEditorResizer',
});

const emit = defineEmits<{
  change: [e: OnDrag];
}>();

const target = ref<HTMLSpanElement>();
const { isDraging } = useGetSo(target, emit);
</script>
