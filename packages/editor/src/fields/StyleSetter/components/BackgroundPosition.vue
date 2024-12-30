<template>
  <div class="background-position-container">
    <div class="presets-value-list">
      <TMagicButton
        v-for="(item, index) in list"
        :key="index"
        link
        :class="model[name] === item.value && 'btn-active'"
        @click="changeHandler(item.value)"
      >
        <div :class="['position-icon', item.class, model[name] === item.value && 'active']"></div>
      </TMagicButton>
    </div>
    <div class="custom-value">
      <TMagicInput v-model="model[name]" size="small" placeholder="自定义背景位置" clearable @change="changeHandler">
      </TMagicInput>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { TMagicButton, TMagicInput } from '@tmagic/design';
import type { FieldProps, FormItem } from '@tmagic/form';

const emit = defineEmits(['change']);
defineProps<FieldProps<{ type: 'style-setter' } & FormItem>>();

const horizontalList = [
  {
    value: 'left',
    text: '左',
  },
  {
    value: 'center',
    text: '中',
  },
  {
    value: 'right',
    text: '右',
  },
];

const verticalList = [
  {
    value: 'top',
    text: '上',
  },
  {
    value: 'center',
    text: '中',
  },
  {
    value: 'bottom',
    text: '下',
  },
];

const list = verticalList
  .map((vertical) =>
    horizontalList.map((horizontal) => ({
      value: `${horizontal.value} ${vertical.value}`,
      tips: `${horizontal.text}${vertical.text}`,
      class: `${horizontal.value}-${vertical.value}`,
    })),
  )
  .flat();

const changeHandler = (v: string) => {
  emit('change', v);
};
</script>
