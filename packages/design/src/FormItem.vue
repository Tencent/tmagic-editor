<template>
  <component class="tmagic-design-form-item" :is="uiComponent" v-bind="uiProps">
    <template #label>
      <slot name="label"></slot>
    </template>

    <template #default>
      <slot></slot>
      <div v-if="adapterType === 'element-plus' && extra" v-html="extra" class="m-form-tip"></div>
    </template>

    <template v-if="adapterType === 'element-plus'" #error="{ error }">
      <div class="el-form-item__error">{{ resolveErrorText(error) }}</div>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getDesignConfig } from './config';
import { stripValidateSuggestion } from './formValidateMessage';
import type { FormItemProps } from './types';

defineOptions({
  name: 'TMFormItem',
});

const props = defineProps<FormItemProps>();

const ui = getDesignConfig('components')?.formItem;

const uiComponent = ui?.component || 'el-form-item';

const adapterType = getDesignConfig('adapterType');

const uiProps = computed<FormItemProps>(() => {
  const { extra, ...rest } = ui?.props(props) || props;
  return rest;
});

/**
 * 校验错误文案中，「修改建议」仅用于错误汇总展示。
 * form-item 行内错误只展示主错误描述，不展示修改建议。
 */
const resolveErrorText = (error?: string) => stripValidateSuggestion(error);
</script>
