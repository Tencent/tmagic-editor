<template>
  <TMagicRadioGroup v-if="model" :model-value="model[name]" :size="size" :disabled="disabled">
    <component
      v-for="option in config.options"
      :is="itemComponent"
      :value="option.value"
      :key="`${option.value}`"
      @click="clickHandler(option.value)"
    >
      <TMagicTooltip :disabled="!Boolean(option.tooltip)" placement="top-start" :content="option.tooltip">
        <div>
          <TMagicIcon v-if="option.icon" :size="iconSize"><component :is="option.icon"></component></TMagicIcon>
          <span>{{ option.text }}</span>
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
  // 再次点击取消选中
  emit('change', props.model[props.name] === item ? '' : item);
};

useAddField(props.prop);

const iconSize = computed(() => {
  if (props.size === 'small') {
    return '12';
  }
  if (props.size === 'large') {
    return '16';
  }
  return '14';
});
</script>
