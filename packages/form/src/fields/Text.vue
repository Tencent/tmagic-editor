<template>
  <TMagicPopover :visible="popoverVisible" width="220px">
    <template #reference>
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
        <template #append v-if="appendConfig">
          <TMagicButton
            v-if="appendConfig.type === 'button'"
            style="color: #409eff"
            :size="size"
            @click.prevent="buttonClickHandler"
          >
            {{ appendConfig.text }}
          </TMagicButton>
        </template>
      </TMagicInput>
    </template>

    <div class="m-form-item__content">
      <div class="m-form-validate__warning">输入内容前后有空格，是否移除空格？</div>
      <div style="display: flex; justify-content: flex-end">
        <TMagicButton link size="small" @click="popoverVisible = false">保持原样</TMagicButton>
        <TMagicButton type="primary" size="small" @click="confirmTrimHandler">移除空格</TMagicButton>
      </div>
    </div>
  </TMagicPopover>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';

import { TMagicButton, TMagicInput, TMagicPopover } from '@tmagic/design';
import { isNumber } from '@tmagic/utils';

import type { FieldProps, FormState, TextConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormText',
});

const props = defineProps<FieldProps<TextConfig>>();

const emit = defineEmits<{
  change: [value: string];
  input: [value: string];
}>();

useAddField(props.prop);

const mForm = inject<FormState | undefined>('mForm');

const appendConfig = computed(() => {
  if (typeof props.config.append === 'string') {
    return {
      text: props.config.append,
      type: 'button',
      handler: undefined,
    };
  }

  if (props.config.append && typeof props.config.append === 'object') {
    if (props.config.append.value === 0) {
      return false;
    }

    return props.config.append;
  }

  return false;
});

const popoverVisible = ref(false);

const confirmTrimHandler = () => {
  emit('change', props.model[props.name].trim() || '');
  popoverVisible.value = false;
};

const checkWhiteSpace = (value: unknown) => {
  if (typeof value === 'string' && !props.config.trim) {
    popoverVisible.value = value.trim() !== value;
  }
};

const changeHandler = (value: string) => {
  emit('change', value);
};

const inputHandler = (v: string) => {
  checkWhiteSpace(v);
  emit('input', v);
  mForm?.$emit('field-input', props.prop, v);
};

const buttonClickHandler = () => {
  if (!appendConfig.value) return;
  if (typeof appendConfig.value.handler === 'function') {
    appendConfig.value.handler(mForm, {
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
