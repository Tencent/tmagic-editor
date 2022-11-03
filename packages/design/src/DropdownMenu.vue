<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMDropdownMenu">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps();

const uiComponent = getConfig('components').dropdownMenu;

const uiProps = computed(() => uiComponent.props(props));
</script>
