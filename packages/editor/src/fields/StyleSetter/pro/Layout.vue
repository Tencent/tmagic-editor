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
  <Box
    v-show="!['fixed', 'absolute'].includes(values.position)"
    :model="values"
    :last-values="lastValues"
    :is-compare="isCompare"
    :size="size"
    :disabled="disabled"
    @change="change"
  ></Box>
</template>

<script lang="ts" setup>
import { markRaw } from 'vue';

import { useTheme } from '@tmagic/design';
import type { ContainerChangeEventData } from '@tmagic/form';
import { defineFormConfig, MContainer } from '@tmagic/form';
import type { StyleSchema } from '@tmagic/schema';

import Box from '../components/Box.vue';
import {
  AlignItemsCenter,
  AlignItemsFlexEnd,
  AlignItemsFlexStart,
  AlignItemsSpaceAround,
  AlignItemsSpaceBetween,
} from '../icons/align-items';
import { DisplayBlock, DisplayFlex, DisplayInline, DisplayInlineBlock, DisplayNone } from '../icons/display';
import {
  FlexDirectionColumn,
  FlexDirectionColumnReverse,
  FlexDirectionRow,
  FlexDirectionRowReverse,
} from '../icons/flex-direction';
import {
  JustifyContentCenter,
  JustifyContentFlexEnd,
  JustifyContentFlexStart,
  JustifyContentSpaceAround,
  JustifyContentSpaceBetween,
} from '../icons/justify-content';

const props = defineProps<{
  values: Partial<StyleSchema>;
  lastValues?: Partial<StyleSchema>;
  isCompare?: boolean;
  disabled?: boolean;
  size?: 'large' | 'default' | 'small';
  theme?: string;
  prop?: string;
}>();

const emit = defineEmits<{
  change: [v: string | StyleSchema, eventData: ContainerChangeEventData];
  addDiffCount: [];
}>();

const displayTheme = useTheme(props);

const formConfig = defineFormConfig([
  {
    name: 'display',
    text: '模式',
    type: 'radioGroup',
    childType: 'button',
    labelWidth: '90px',
    iconSize: '24px',
    options: [
      {
        value: 'inline',
        icon: markRaw(DisplayInline),
        tooltip: '内联布局 inline',
      },
      {
        value: 'flex',
        icon: markRaw(DisplayFlex),
        tooltip: '弹性布局 flex',
      },
      {
        value: 'block',
        icon: markRaw(DisplayBlock),
        tooltip: '块级布局 block',
      },
      {
        value: 'inline-block',
        icon: markRaw(DisplayInlineBlock),
        tooltip: '内联块布局 inline-block',
      },
      {
        value: 'none',
        icon: markRaw(DisplayNone),
        tooltip: '隐藏 none',
      },
    ],
  },
  {
    name: 'flexDirection',
    text: '主轴方向',
    type: 'radioGroup',
    childType: 'button',
    labelWidth: '90px',
    iconSize: '24px',
    options: [
      { value: 'row', icon: markRaw(FlexDirectionRow), tooltip: '水平方向 起点在左侧 row' },
      {
        value: 'row-reverse',
        icon: markRaw(FlexDirectionRowReverse),
        tooltip: '水平方向 起点在右侧 row-reverse',
      },
      {
        value: 'column',
        icon: markRaw(FlexDirectionColumn),
        tooltip: '垂直方向 起点在上沿 column',
      },
      {
        value: 'column-reverse',
        icon: markRaw(FlexDirectionColumnReverse),
        tooltip: '垂直方向 起点在下沿 column-reverse',
      },
    ],
    display: (_mForm, { model }: { model: Record<any, any> }) => model.display === 'flex',
  },
  {
    name: 'justifyContent',
    text: '主轴对齐',
    type: 'radioGroup',
    childType: 'button',
    labelWidth: '90px',
    iconSize: '24px',
    options: [
      { value: 'flex-start', icon: markRaw(JustifyContentFlexStart), tooltip: '左对齐 flex-start' },
      { value: 'flex-end', icon: markRaw(JustifyContentFlexEnd), tooltip: '右对齐 flex-end' },
      { value: 'center', icon: markRaw(JustifyContentCenter), tooltip: '居中 center' },
      {
        value: 'space-between',
        icon: markRaw(JustifyContentSpaceBetween),
        tooltip: '两端对齐 space-between',
      },
      {
        value: 'space-around',
        icon: markRaw(JustifyContentSpaceAround),
        tooltip: '横向平分 space-around',
      },
    ],
    display: (_mForm, { model }: { model: Record<any, any> }) => model.display === 'flex',
  },
  {
    name: 'alignItems',
    text: '辅轴对齐',
    type: 'radioGroup',
    childType: 'button',
    labelWidth: '90px',
    iconSize: '24px',
    options: [
      { value: 'flex-start', icon: markRaw(AlignItemsFlexStart), tooltip: '左对齐 flex-start' },
      { value: 'flex-end', icon: markRaw(AlignItemsFlexEnd), tooltip: '右对齐 flex-end' },
      { value: 'center', icon: markRaw(AlignItemsCenter), tooltip: '居中 center' },
      {
        value: 'space-between',
        icon: markRaw(AlignItemsSpaceBetween),
        tooltip: '两端对齐 space-between',
      },
      {
        value: 'space-around',
        icon: markRaw(AlignItemsSpaceAround),
        tooltip: '横向平分 space-around',
      },
    ],
    display: (_mForm, { model }: { model: Record<any, any> }) => model.display === 'flex',
  },
  {
    name: 'flexWrap',
    text: '换行',
    type: 'radioGroup',
    childType: displayTheme.value !== 'magic-admin' ? 'button' : 'default',
    labelWidth: '90px',
    iconSize: '24px',
    options: [
      { value: 'nowrap', text: '不换行', tooltip: '不换行 nowrap' },
      { value: 'wrap', text: '正换行', tooltip: '第一行在上方 wrap' },
      { value: 'wrap-reverse', text: '逆换行', tooltip: '第一行在下方 wrap-reverse' },
    ],
    display: (_mForm, { model }: { model: Record<any, any> }) => model.display === 'flex',
  },
  {
    type: 'row',
    items: [
      {
        name: 'width',
        text: '宽度（px）',
        labelWidth: '90px',
        type: 'data-source-field-select',
        fieldConfig: {
          type: 'text',
        },
      },
    ],
  },
  {
    type: 'row',
    items: [
      {
        name: 'height',
        text: '高度（px）',
        labelWidth: '90px',
        type: 'data-source-field-select',
        fieldConfig: {
          type: 'text',
        },
      },
    ],
  },
  {
    type: 'row',
    items: [
      {
        type: 'data-source-field-select',
        text: 'overflow',
        name: 'overflow',
        labelWidth: '90px',
        checkStrictly: false,
        dataSourceFieldType: ['string'],
        fieldConfig: {
          type: 'select',
          clearable: true,
          allowCreate: true,
          options: [
            { text: 'visible', value: 'visible' },
            { text: 'hidden', value: 'hidden' },
            { text: 'clip', value: 'clip' },
            { text: 'scroll', value: 'scroll' },
            { text: 'auto', value: 'auto' },
            { text: 'overlay', value: 'overlay' },
            { text: 'initial', value: 'initial' },
          ],
        },
      },
    ],
  },
  {
    type: 'row',
    items: [
      {
        type: 'data-source-field-select',
        text: '透明度（%）',
        name: 'opacity',
        labelWidth: '90px',
        dataSourceFieldType: ['string', 'number'],
        fieldConfig: {
          type: 'text',
        },
      },
    ],
  },
]);

const change = (value: string | StyleSchema, eventData: ContainerChangeEventData) => {
  emit('change', value, eventData);
};

const onAddDiffCount = () => emit('addDiffCount');
</script>
