<template>
  <component class="tmagic-design-popover" :is="uiComponent" v-bind="uiProps">
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

const props = withDefaults(defineProps<PopoverProps>(), { visible: null });

const ui = getConfig('components')?.popover;

const uiComponent = ui?.component || 'el-popover';

const uiProps = computed(() => ui?.props(props) || props);
</script>
