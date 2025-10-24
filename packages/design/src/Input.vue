<template>
  <component
    ref="instance"
    class="tmagic-design-input"
    :is="uiComponent"
    v-bind="uiProps"
    @change="changeHandler"
    @input="inputHandler"
    @update:modelValue="updateModelValue"
    @blur="blurHandler"
    @focus="focusHandler"
  >
    <template #prepend v-if="$slots.prepend">
      <slot name="prepend"></slot>
    </template>
    <template #append v-if="$slots.append">
      <slot name="append"></slot>
    </template>
    <template #prefix v-if="$slots.prefix">
      <slot name="prefix"></slot>
    </template>
    <template #suffix v-if="$slots.suffix">
      <slot name="suffix"></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { getDesignConfig } from './config';
import type { InputProps } from './types';

defineOptions({
  name: 'TMInput',
});

const props = defineProps<InputProps>();

const ui = getDesignConfig('components')?.input;

const uiComponent = ui?.component || 'el-input';

const uiProps = computed<InputProps>(() => ui?.props(props) || props);

const emit = defineEmits(['change', 'input', 'blur', 'focus', 'update:modelValue']);

const instance = ref<any>();

const changeHandler = (...args: any[]) => {
  emit('change', ...args);
};

const inputHandler = (...args: any[]) => {
  emit('input', ...args);
};

const updateModelValue = (...args: any[]) => {
  emit('update:modelValue', ...args);
};

const blurHandler = (...args: any[]) => {
  emit('blur', ...args);
};

const focusHandler = (...args: any[]) => {
  emit('focus', ...args);
};

defineExpose({
  instance,
  getInput() {
    if (instance.value.input) {
      return instance.value.input;
    }
    return instance.value?.$el?.querySelector('input');
  },
  getTextarea() {
    if (instance.value.textarea) {
      return instance.value.textarea;
    }
    return instance.value?.$el?.querySelector('textarea');
  },
});
</script>

<style lang="scss">
.tmagic-design-input {
  &.t-input-adornment {
    .t-input-adornment__prepend {
      > span {
        border-radius: var(--td-radius-default) 0 0 var(--td-radius-default);
      }
    }
    .t-input-adornment__append {
      > span {
        border-radius: 0 var(--td-radius-default) var(--td-radius-default) 0;
      }
    }
    .t-input-adornment__prepend,
    .t-input-adornment__append {
      > span {
        display: inline-flex;
        height: 100%;
        align-items: center;
        box-sizing: border-box;
        white-space: nowrap;
        padding: 0 var(--td-comp-paddingLR-s);
        border: 1px solid var(--td-border-level-2-color);
      }
    }
  }
}
</style>
