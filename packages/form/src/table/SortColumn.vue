<template>
  <TMagicTooltip v-if="index + 1 + currentPage * pageSize - 1 !== 0" content="点击上移，双击置顶" placement="top">
    <TMagicButton
      plain
      size="small"
      type="primary"
      :icon="ArrowUp"
      :disabled="disabled"
      link
      @click="upHandler(index + 1 + currentPage * pageSize - 1)"
      @dblclick="topHandler(index + 1 + currentPage * pageSize - 1)"
    ></TMagicButton>
  </TMagicTooltip>
  <TMagicTooltip
    v-if="index + 1 + currentPage * pageSize - 1 !== model[name].length - 1"
    content="点击下移，双击置底"
    placement="top"
  >
    <TMagicButton
      plain
      size="small"
      type="primary"
      :icon="ArrowDown"
      :disabled="disabled"
      link
      @click="downHandler(index + 1 + currentPage * pageSize - 1)"
      @dblclick="bottomHandler(index + 1 + currentPage * pageSize - 1)"
    ></TMagicButton>
  </TMagicTooltip>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue';

import { TMagicButton, TMagicTooltip } from '@tmagic/design';

const props = defineProps<{
  index: number;
  disabled?: boolean;
  currentPage: number;
  pageSize: number;
  name: string | number;
  model: any;
}>();

const emit = defineEmits(['swap']);

let timer: ReturnType<typeof setTimeout> | null = null;

const upHandler = (index: number) => {
  if (timer) {
    clearTimeout(timer);
  }

  timer = setTimeout(() => {
    emit('swap', index, index - 1);
    timer = null;
  }, 300);
};

const topHandler = (index: number) => {
  if (timer) {
    clearTimeout(timer);
  }

  // 首先判断当前元素需要上移几个位置,置底移动到数组的第一位
  const moveNum = index;

  // 循环出需要一个一个上移的次数
  for (let i = 0; i < moveNum; i++) {
    emit('swap', index, index - 1);
    index -= 1;
  }
};

const downHandler = (index: number) => {
  if (timer) {
    clearTimeout(timer);
  }

  timer = setTimeout(() => {
    emit('swap', index, index + 1);
    timer = null;
  }, 300);
};

const bottomHandler = (index: number) => {
  if (timer) {
    clearTimeout(timer);
  }

  // 首先判断当前元素需要上移几个位置,置底移动到数组的第一位
  const moveNum = props.model[props.name].length - 1 - index;

  // 循环出需要一个一个上移的次数
  for (let i = 0; i < moveNum; i++) {
    emit('swap', index, index + 1);
    index += 1;
  }
};
</script>
