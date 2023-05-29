<template>
  <TMagicInput
    v-model="model[name]"
    clearable
    :size="size"
    :placeholder="config.placeholder"
    :disabled="disabled"
    @change="changeHandler"
    @input="inputHandler"
    @keyup="keyUpHandler($event)"
  >
    <template #append v-if="config.append">
      <span v-if="typeof config.append === 'string'">{{ config.append }}</span>
      <TMagicButton
        v-if="typeof config.append === 'object' && config.append.type === 'button'"
        style="color: #409eff"
        :size="size"
        @click.prevent="buttonClickHandler"
      >
        {{ config.append.text }}
      </TMagicButton>
    </template>
  </TMagicInput>
</template>

<script lang="ts" setup>
import { inject } from 'vue';

import { TMagicButton, TMagicInput } from '@tmagic/design';
import { isNumber } from '@tmagic/utils';

import { FormState, TextConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormText',
});

const props = defineProps<{
  config: TextConfig;
  model: any;
  initValues?: any;
  values?: any;
  name: string;
  prop: string;
  disabled?: boolean;
  size?: 'large' | 'default' | 'small';
  lastValues?: Record<string, any>;
}>();

const emit = defineEmits(['change', 'input']);

useAddField(props.prop);

const mForm = inject<FormState | undefined>('mForm');

const changeHandler = (value: number) => {
  emit('change', value);
};

const inputHandler = (v: string) => {
  emit('input', v);
  mForm?.$emit('field-input', props.prop, v);
};

const buttonClickHandler = () => {
  if (typeof props.config.append === 'string') return;

  if (props.config.append?.handler) {
    props.config.append.handler(mForm, {
      model: props.model,
      values: mForm?.values,
    });
  }
};

const keyUpHandler = ($event: KeyboardEvent) => {
  if (!props.model) return;
  if (!props.name) return;

  const arrowUp = $event.key === 'ArrowUp';
  const arrowDown = $event.key === 'ArrowDown';

  if (!arrowUp && !arrowDown) {
    return;
  }

  const value = props.model[props.name];
  let num;
  let unit;
  if (isNumber(value)) {
    num = +value;
  } else {
    value.replace(/^([0-9.]+)([a-z%]+)$/, ($0: string, $1: string, $2: string) => {
      num = +$1;
      unit = $2;
    });
  }

  if (num === undefined) {
    return;
  }

  const ctrl = navigator.platform.match('Mac') ? $event.metaKey : $event.ctrlKey;
  const shift = $event.shiftKey;
  const alt = $event.altKey;

  if (arrowUp) {
    if (ctrl) {
      num += 100;
    } else if (alt) {
      num = (num * 10000 + 1000) / 10000;
    } else if (shift) {
      num = num + 10;
    } else {
      num += 1;
    }
  } else if (arrowDown) {
    if (ctrl) {
      num -= 100;
    } else if (alt) {
      num = (num * 10000 - 1000) / 10000;
    } else if (shift) {
      num -= 10;
    } else {
      num -= 1;
    }
  }

  props.model[props.name] = `${num}${unit || ''}`;
  emit('change', props.model[props.name]);
};
</script>
