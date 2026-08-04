<template>
  <MContainer
    v-for="(item, index) in formConfig"
    :prop="prop"
    :key="index"
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

import { appendValidateSuggestion } from '@tmagic/design';
import { type ContainerChangeEventData, defineFormConfig, MContainer } from '@tmagic/form';
import type { StyleSchema } from '@tmagic/schema';

import { validateDataSourceFieldSelectValue } from '@editor/utils/type-match-rules';

import { AlignCenter, AlignLeft, AlignRight } from '../icons/text-align';

defineProps<{
  values: Partial<StyleSchema>;
  lastValues?: Partial<StyleSchema>;
  isCompare?: boolean;
  disabled?: boolean;
  size?: 'large' | 'default' | 'small';
  prop?: string;
}>();

const emit = defineEmits<{
  change: [v: StyleSchema, eventData: ContainerChangeEventData];
  addDiffCount: [];
}>();

const formConfig = defineFormConfig([
  {
    type: 'row',
    items: [
      {
        labelWidth: '68px',
        name: 'fontSize',
        text: '字号',
        type: 'data-source-field-select',
        fieldConfig: {
          type: 'text',
        },
        rules: [
          {
            typeMatch: true,
            message: appendValidateSuggestion('字号应为字符串或数字', '请参考以下示例值：24 或 "24"'),
          },
        ],
      },
      {
        labelWidth: '68px',
        name: 'lineHeight',
        text: '行高',
        type: 'data-source-field-select',
        fieldConfig: {
          type: 'text',
        },
      },
    ],
  },
  {
    name: 'fontWeight',
    text: '字重',
    labelWidth: '68px',
    type: 'data-source-field-select',
    dataSourceFieldType: ['string', 'number'],
    fieldConfig: {
      type: 'select',
      allowCreate: true,
      options: ['normal', 'bold']
        .concat(
          Array(7)
            .fill(1)
            .map((x, i) => `${i + 1}00`),
        )
        .map((item) => ({
          value: item,
          text: item,
        })),
    },
    rules: [
      {
        typeMatch: false,
      },
      {
        validator: ({ value, callback }, { config, model, prop }, mForm) => {
          if (value === '' || value === null || value === undefined) {
            return callback();
          }

          const result = validateDataSourceFieldSelectValue(
            value,
            {
              fieldType: 'data-source-field-select',
              mForm,
              props: { config, model, prop },
            },
            {
              // 字重允许 string（含可创建项）与 number（如 700）
              validatePlainValue: (plainValue) => {
                if (typeof plainValue === 'string' || (typeof plainValue === 'number' && !Number.isNaN(plainValue))) {
                  return undefined;
                }
                return '字重应为字符串或数字';
              },
            },
          );

          if (result && typeof (result as Promise<string | undefined>).then === 'function') {
            (result as Promise<string | undefined>).then(
              (error) => callback(error),
              (error) => callback(error),
            );
            return;
          }

          return callback(result);
        },
      },
    ],
  },
  {
    labelWidth: '68px',
    name: 'color',
    text: '颜色',
    type: 'data-source-field-select',
    fieldConfig: {
      type: 'colorPicker',
    },
    rules: [
      {
        typeMatch: true,
        message: appendValidateSuggestion('颜色应为字符串', '请参考以下示例值："#000000"'),
      },
    ],
  },
  {
    name: 'textAlign',
    text: '对齐',
    type: 'radioGroup',
    childType: 'button',
    labelWidth: '68px',
    options: [
      { value: 'left', icon: markRaw(AlignLeft), tooltip: '左对齐 row', text: '左对齐' },
      { value: 'center', icon: markRaw(AlignCenter), tooltip: '居中对齐 center', text: '居中对齐' },
      { value: 'right', icon: markRaw(AlignRight), tooltip: '右对齐 right', text: '右对齐' },
    ],
  },
]);

const change = (value: StyleSchema, eventData: ContainerChangeEventData) => {
  emit('change', value, eventData);
};

const onAddDiffCount = () => emit('addDiffCount');
</script>
