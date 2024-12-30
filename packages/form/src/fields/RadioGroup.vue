<template>
  <TMagicRadioGroup v-if="model" v-model="model[name]" :size="size" :disabled="disabled">
    <component
      :is="itemComponent"
      v-for="option in config.options"
      :value="option.value"
      :key="`${option.value}`"
      @click.prevent="clickHandler(option.value)"
    >
      <TMagicTooltip v-if="option.tooltip" placement="top-start" :content="option.tooltip">
        <div>
          <TMagicIcon v-if="option.icon" :size="'16'"><component :is="option.icon"></component></TMagicIcon>
          <span>{{ option.text }}</span>
        </div>
      </TMagicTooltip>
      <div v-else>
        <TMagicIcon v-if="option.icon" :size="'16'"><component :is="option.icon"></component></TMagicIcon>
        <span>{{ option.text }}</span>
      </div>
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

const changeHandler = (value: number) => {
  emit('change', value);
};

const clickHandler = (item: any) => {
  props.model[props.name] = props.model[props.name] === item ? '' : item;
  changeHandler(props.model[props.name]);
};

useAddField(props.prop);
</script>
