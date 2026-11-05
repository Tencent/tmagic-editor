<template>
  <component
    class="tmagic-design-popconfirm"
    :is="uiComponent"
    v-bind="uiProps"
    @confirm="confirmHandler"
    @cancel="cancelHandler"
  >
    <template #reference>
      <slot name="reference"></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getDesignConfig } from './config';
import type { PopconfirmProps } from './types';

defineOptions({
  name: 'TMPopconfirm',
});

const emit = defineEmits(['confirm', 'cancel']);

// Boolean 类型的属性缺省时会被 Vue 转成 false，会把浮层强制内联渲染到侧栏等 overflow 容器中，
// 导致 placement 计算出的位置被裁剪。与 PopconfirmProps 注释及底层组件默认值保持一致。
const props = withDefaults(defineProps<PopconfirmProps>(), {
  teleported: true,
});

const ui = getDesignConfig('components')?.popconfirm;

const uiComponent = ui?.component || 'el-popconfirm';

const uiProps = computed<PopconfirmProps>(() => ui?.props(props) || props);

const confirmHandler = (...args: any[]) => {
  emit('confirm', ...args);
};

const cancelHandler = (...args: any[]) => {
  emit('cancel', ...args);
};
</script>
