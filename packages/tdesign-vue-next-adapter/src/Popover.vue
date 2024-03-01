<template>
  <TPopup
    :placement="placement"
    :trigger="trigger"
    :disabled="disabled"
    :visible="visible"
    :overlayClassName="popperClass"
  >
    <slot name="reference"></slot>

    <template #content>
      <slot></slot>
    </template>
  </TPopup>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Popup as TPopup, type PopupPlacement } from 'tdesign-vue-next';

import type { PopoverProps } from '@tmagic/design';

const props = defineProps<PopoverProps>();

const placement = computed(() => props.placement as PopupPlacement);
const trigger = computed(() => props.trigger as 'click' | 'focus' | 'mousedown' | 'context-menu' | 'hover');
</script>
