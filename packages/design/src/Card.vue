<template>
  <component :is="uiComponent" :class="['tmagic-design-card', { 'tmagic-design-card--flat': isFlat }]" v-bind="uiProps">
    <template #header v-if="$slots.header">
      <slot name="header" class="header"></slot>
    </template>

    <template #default v-if="$slots.default">
      <slot name="default"></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getDesignConfig } from './config';
import { isGlobalFlat } from './index';
import type { CardProps } from './types';

defineOptions({
  name: 'TMCard',
});

const props = defineProps<CardProps>();

const ui = getDesignConfig('components')?.card;

const uiComponent = ui?.component || 'el-card';

// 当祖先 `<MEditor>` / `<MForm>` 的 theme 是 `magic-admin` 时，整套设计语言默认走「无卡片感」，
// 因此这里自动等价于 `flat=true`；调用方仍可显式传 `flat` 强制开启。
const isFlat = computed(() => !!props.flat || isGlobalFlat.value);

// 把 `flat` 从转发给底层 UI 库（el-card / t-card 等）的 props 中剥离：
// 它仅作用于本组件的视觉修饰类，不需要也不应该作为属性落到底层组件 / DOM 上。
const uiProps = computed<CardProps>(() => {
  const { flat: _flat, ...rest } = props;
  return ui?.props(rest as CardProps) || (rest as CardProps);
});
</script>
