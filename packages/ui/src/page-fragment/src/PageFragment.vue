<template>
  <div
    :id="`${config.id || ''}`"
    :class="`magic-ui-page-fragment magic-ui-container magic-layout-${config.layout}${
      config.className ? ` ${config.className}` : ''
    }`"
    :style="style"
  >
    <slot></slot>
    <MComponent v-for="item in config.items" :key="item.id" :config="item"></MComponent>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';

import Core from '@tmagic/core';
import type { MPageFragment } from '@tmagic/schema';

import MComponent from '../../Component.vue';
import useApp from '../../useApp';

const props = withDefaults(
  defineProps<{
    config: MPageFragment;
    model?: any;
  }>(),
  {
    model: () => ({}),
  },
);

const app: Core | undefined = inject('app');

const style = computed(() => app?.transformStyle(props.config.style || {}));

useApp({
  config: props.config,
  methods: {},
});
</script>
