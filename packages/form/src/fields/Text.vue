<template>
  <el-input
    v-model="model[modelName]"
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
      <el-button
        v-if="typeof config.append === 'object' && config.append.type === 'button'"
        style="color: #409eff"
        :size="size"
        @click.prevent="buttonClickHandler"
      >
        {{ config.append.text }}
      </el-button>
    </template>
  </el-input>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType } from 'vue';

import { isNumber } from '@tmagic/utils';

import { FormState, TextConfig } from '../schema';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';

export default defineComponent({
  name: 'm-fields-text',

  props: {
    ...fieldProps,
    config: {
      type: Object as PropType<TextConfig>,
      required: true,
    },
  },

  emits: ['change', 'input'],

  setup(props, { emit }) {
    const mForm = inject<FormState | undefined>('mForm');

    useAddField(props.prop);

    const modelName = computed(() => props.name || props.config.name || '');
    return {
      modelName,

      changeHandler(v: string | number) {
        emit('change', v);
      },

      inputHandler(v: string | number) {
        emit('input', v);
        mForm?.$emit('field-input', props.prop, v);
      },

      buttonClickHandler() {
        if (typeof props.config.append === 'string') return;

        if (props.config.append?.handler) {
          props.config.append.handler(mForm, {
            model: props.model,
            values: mForm?.values,
          });
        }
      },

      keyUpHandler($event: KeyboardEvent) {
        if (!props.model) return;
        if (!modelName.value) return;

        const arrowUp = $event.key === 'ArrowUp';
        const arrowDown = $event.key === 'ArrowDown';

        if (!arrowUp && !arrowDown) {
          return;
        }

        const value = props.model[modelName.value];
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

        props.model[modelName.value] = `${num}${unit || ''}`;
        emit('change', props.model[modelName.value]);
      },
    };
  },
});
</script>
