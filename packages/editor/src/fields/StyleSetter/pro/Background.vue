<template>
  <MContainer
    v-for="item in formConfig"
    :prop="prop"
    :key="item.name"
    :config="item"
    :model="values"
    :last-values="lastValues"
    :is-compare="isCompare"
    :size="size"
    :disabled="disabled"
    @change="change"
    @add-diff-count="onAddDiffCount"
  ></MContainer>
</template>

<script lang="ts" setup>
import { markRaw } from 'vue';

import { type ContainerChangeEventData, defineFormConfig, MContainer } from '@tmagic/form';
import type { StyleSchema } from '@tmagic/schema';

import BackgroundPosition from '../components/BackgroundPosition.vue';
import { BackgroundNoRepeat, BackgroundRepeat, BackgroundRepeatX, BackgroundRepeatY } from '../icons/background-repeat';

defineProps<{
  values: Partial<StyleSchema>;
  lastValues?: Partial<StyleSchema>;
  isCompare?: boolean;
  disabled?: boolean;
  size?: 'large' | 'default' | 'small';
  theme?: string;
  prop?: string;
}>();

const emit = defineEmits<{
  change: [v: StyleSchema, eventData: ContainerChangeEventData];
  addDiffCount: [];
}>();

const formConfig = defineFormConfig([
  {
    name: 'backgroundColor',
    text: '背景色',
    labelWidth: '68px',
    type: 'data-source-field-select',
    fieldConfig: {
      type: 'colorPicker',
    },
  },
  {
    name: 'backgroundImage',
    text: '背景图',
    labelWidth: '68px',
    type: 'data-source-field-select',
    fieldConfig: {
      type: 'img-upload',
    } as any,
  },
  {
    name: 'backgroundSize',
    text: '背景尺寸',
    type: 'radioGroup',
    childType: 'button',
    labelWidth: '68px',
    options: [
      { value: 'auto', text: '默认', tooltip: '默认 auto' },
      { value: 'contain', text: '等比填充', tooltip: '等比填充 contain' },
      { value: 'cover', text: '等比覆盖', tooltip: '等比覆盖 cover' },
    ],
    rules: [
      {
        typeMatch: false,
      },
      {
        validator: ({ value, callback }) => {
          if (value === '' || value === null || value === undefined) {
            return callback();
          }

          const keywords = ['auto', 'cover', 'contain', 'inherit', 'initial', 'revert', 'unset'];
          // 单值：关键字 或 长度/百分比
          const lengthPercent = /^-?\d+(\.\d+)?(px|em|rem|ex|ch|vw|vh|vmin|vmax|cm|mm|in|pt|pc|%)$/;
          const singleValue = (v: string) => keywords.includes(v) || lengthPercent.test(v);

          const str = String(value).trim();
          const parts = str.split(/\s+/);

          // cover / contain 不能与其他值组合
          if (parts.length > 1 && (parts.includes('cover') || parts.includes('contain'))) {
            return callback('cover/contain 不能与其他值组合');
          }

          // 多值最多两个
          if (parts.length > 2) {
            return callback('backgroundSize 最多支持两个值');
          }

          // 关键字 auto 在多值场景中允许与其他长度/百分比组合
          if (parts.every((part) => singleValue(part))) {
            return callback();
          }

          return callback('backgroundSize 值不合法');
        },
      },
    ],
  },
  {
    name: 'backgroundRepeat',
    text: '重复显示',
    type: 'radioGroup',
    childType: 'button',
    labelWidth: '68px',
    options: [
      { value: 'no-repeat', icon: markRaw(BackgroundNoRepeat), tooltip: '不重复 no-repeat' },
      { value: 'repeat-x', icon: markRaw(BackgroundRepeatX), tooltip: '水平方向重复 repeat-x' },
      { value: 'repeat-y', icon: markRaw(BackgroundRepeatY), tooltip: '垂直方向重复 repeat-y' },
      {
        value: 'repeat',
        icon: markRaw(BackgroundRepeat),
        tooltip: '垂直和水平方向重复 repeat',
      },
    ],
  },
  {
    name: 'backgroundPosition',
    text: '背景定位',
    type: 'component',
    component: BackgroundPosition,
    labelWidth: '68px',
  },
]);

const change = (value: StyleSchema, eventData: ContainerChangeEventData) => {
  emit('change', value, eventData);
};

const onAddDiffCount = () => emit('addDiffCount');
</script>
