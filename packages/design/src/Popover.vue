<template>
  <component class="tmagic-design-popover" :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>

    <template #reference>
      <slot name="reference"></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { PopoverProps } from './types';

defineOptions({
  name: 'TMPopover',
});

const props = defineProps<PopoverProps>();

const uiComponent = getConfig('components').popover;

const uiProps = computed(() => uiComponent.props(props));
</script>
