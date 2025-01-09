<template>
  <span ref="target" class="m-editor-resizer" :class="{ 'm-editor-resizer-dragging': isDragging }">
    <slot></slot>
  </span>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import type { OnDrag } from 'gesto';

import { useGetSo } from '@editor/hooks/use-getso';

defineOptions({
  name: 'MEditorResizer',
});

const emit = defineEmits<{
  change: [e: OnDrag];
}>();

const targetEl = useTemplateRef<HTMLSpanElement>('target');
const { isDragging } = useGetSo(targetEl, emit);
</script>
