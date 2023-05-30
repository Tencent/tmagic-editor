<template>
  <component class="tmagic-design-tag" :is="uiComponent" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { TagProps } from './types';

defineOptions({
  name: 'TMTag',
});

const props = defineProps<TagProps>();

const ui = getConfig('components')?.tag;

const uiComponent = ui?.component || 'el-tag';

const uiProps = computed(() => ui?.props(props) || props);
</script>
