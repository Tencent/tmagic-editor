<template>
  <!-- ElTooltip 的 ElOnlyChild 要求默认插槽至少有一个真实节点；v-if 为 false 时插槽是 Comment，会报 no valid child node found。 -->
  <component
    v-if="isLegitTooltipTrigger($slots.default?.())"
    class="tmagic-design-tooltip"
    :is="uiComponent"
    v-bind="uiProps"
  >
    <template #content>
      <slot name="content"></slot>
    </template>
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { Comment, computed, Fragment, Text, type VNode } from 'vue';

import { getDesignConfig } from './config';
import type { TooltipProps } from './types';

defineOptions({
  name: 'TMTooltip',
});

const props = defineProps<TooltipProps>();

const ui = getDesignConfig('components')?.tooltip;

const uiComponent = ui?.component || 'el-tooltip';

const uiProps = computed<TooltipProps>(() => ui?.props(props) || props);

/** 与 Element Plus `findFirstLegitChild` 对齐：Comment / 空文本不算合法 trigger。 */
const isLegitTooltipTrigger = (nodes: VNode[] | undefined): boolean => {
  if (!nodes?.length) return false;

  for (const child of nodes) {
    if (!child) continue;

    switch (child.type) {
      case Comment:
        continue;
      case Text: {
        const text = typeof child.children === 'string' ? child.children.trim() : '';
        if (text) return true;
        continue;
      }
      case Fragment:
        if (isLegitTooltipTrigger(child.children as VNode[])) return true;
        continue;
      default:
        return true;
    }
  }

  return false;
};
</script>
