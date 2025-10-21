<template>
  <component class="tmagic-design-icon" :is="uiComponent" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getDesignConfig } from './config';
import { IconProps } from './types';

defineOptions({
  name: 'TMIcon',
});

const ui = getDesignConfig('components')?.icon;
const uiComponent = ui?.component || 'el-icon';
const props = defineProps<IconProps>();
const uiProps = computed<IconProps>(() => ui?.props(props) || props);
</script>

<style lang="scss">
.t-t-design-adapter-icon {
  justify-content: center;
  align-items: center;
  display: flex;

  svg {
    width: 1em;
    height: 1em;
  }
}
</style>
