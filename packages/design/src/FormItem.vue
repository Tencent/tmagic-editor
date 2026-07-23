<template>
  <component
    class="tmagic-design-form-item"
    :class="{ 'has-extra-tips': adapterType === 'element-plus' && extraTips }"
    :is="uiComponent"
    v-bind="uiProps"
  >
    <template #label>
      <slot name="label"> </slot>
    </template>

    <template #default>
      <slot></slot>
      <alert
        v-if="adapterType === 'element-plus' && extraTips"
        :title="extraTips"
        type="warning"
        show-icon
        :closable="false"
      ></alert>
      <div v-else-if="adapterType === 'element-plus' && extra" v-html="extra" class="m-form-tip"></div>
    </template>

    <template v-if="adapterType === 'element-plus'" #error="{ error }">
      <div class="el-form-item__error">{{ resolveErrorText(error) }}</div>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';

import Alert from './Alert.vue';
import { getDesignConfig } from './config';
import { stripValidateSuggestion } from './formValidateMessage';
import { isGlobalFlat } from './index';
import type { FormItemProps } from './types';

defineOptions({
  name: 'TMFormItem',
});

const props = defineProps<FormItemProps & { theme?: string }>();

const ui = getDesignConfig('components')?.formItem;
const uiComponent = ui?.component || 'el-form-item';

const adapterType = getDesignConfig('adapterType');

const formInline = inject<boolean>('formInline', false);
const formInRow = inject<boolean>('isInRow', false);
const uiProps = computed<FormItemProps>(() => {
  const { extra, extraTips, ...rest } = ui?.props(props) || props;
  if (isGlobalFlat.value && rest.labelPosition === undefined) {
    return { ...rest, labelPosition: formInline || formInRow ? 'right' : 'left' };
  }
  return rest;
});

/**
 * 校验错误文案中，「修改建议」仅用于错误汇总展示。
 * form-item 行内错误只展示主错误描述，不展示修改建议。
 */
const resolveErrorText = (error?: string) => stripValidateSuggestion(error);
</script>
