<template>
  <TMagicRadioGroup
    v-if="model"
    :model-value="model[name]"
    :size="size"
    :disabled="disabled"
    class="icon-{{ iconSize }}"
  >
    <component
      v-for="option in config.options"
      :is="itemComponent"
      :value="option.value"
      :key="`${option.value}`"
      @click="clickHandler(option.value)"
    >
      <TMagicTooltip :disabled="!Boolean(option.tooltip)" placement="top-start" :content="option.tooltip">
        <div class="m-fields-radio-group__option">
          <TMagicIcon
            v-if="option.icon"
            :size="iconSize"
            :class="{ 'm-fields-radio-group__icon_with_text': !!option.text }"
            ><component :is="option.icon"></component
          ></TMagicIcon>
          <span v-if="option.text" class="m-fields-radio-group__text">{{ option.text }}</span>
        </div>
      </TMagicTooltip>
    </component>
  </TMagicRadioGroup>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { TMagicIcon, TMagicRadio, TMagicRadioButton, TMagicRadioGroup, TMagicTooltip } from '@tmagic/design';

import type { FieldProps, RadioGroupConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormRadioGroup',
});

const props = defineProps<FieldProps<RadioGroupConfig>>();

const itemComponent = computed(() => (props.config.childType === 'button' ? TMagicRadioButton : TMagicRadio));

const emit = defineEmits(['change']);

const clickHandler = (item: string | number | boolean) => {
  if (props.disabled) {
    return;
  }
  // 再次点击取消选中
  emit('change', props.model[props.name] === item ? '' : item);
};

useAddField(props.prop);

// 这里换了设计稿里的图标，所以需要调整一下图标大小
const iconSize = computed(() => {
  if (props.config.iconSize) {
    return props.config.iconSize;
  }
  if (props.size === 'small') {
    return '14';
  }
  if (props.size === 'large') {
    return '16';
  }
  return '16';
});
</script>
