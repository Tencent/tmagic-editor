<template>
  <div class="m-fields-text">
    <TMagicInput
      :model-value="model[name]"
      ref="input"
      clearable
      :size="size"
      :placeholder="config.placeholder"
      :disabled="disabled"
      @update:model-value="changeHandler"
      @input="inputHandler"
      @keyup="keyUpHandler($event)"
    >
      <template #prepend v-if="config.prepend">
        <span>{{ config.prepend }}</span>
      </template>
      <template #append v-if="appendConfig">
        <TMagicButton
          v-if="appendConfig.type === 'button'"
          style="color: #409eff"
          :size="size"
          @click.prevent="buttonClickHandler"
        >
          {{ appendConfig.text }}
        </TMagicButton>
        <span v-else>{{ appendConfig.text }}</span>
      </template>
    </TMagicInput>

    <Teleport to="body">
      <div v-if="popoverVisible" class="tmagic-form-text-popper m-form-item__content" ref="popoverEl">
        <div class="m-form-validate__warning">输入内容前后有空格，是否移除空格？</div>
        <div style="display: flex; justify-content: flex-end">
          <TMagicButton link size="small" @click="popoverVisible = false">保持原样</TMagicButton>
          <TMagicButton type="primary" size="small" @click="confirmTrimHandler">移除空格</TMagicButton>
        </div>
        <span class="tmagic-form-text-popper-arrow" data-popper-arrow></span>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, readonly, ref, shallowRef, watch } from 'vue';
import type { Instance } from '@popperjs/core';
import { createPopper } from '@popperjs/core';
import { debounce } from 'lodash-es';

import { TMagicButton, TMagicInput } from '@tmagic/design';
import { isNumber } from '@tmagic/utils';

import type { ChangeRecord, ContainerChangeEventData, FieldProps, FormState, TextConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormText',
});

const props = defineProps<FieldProps<TextConfig>>();

const emit = defineEmits<{
  change: [value: string, eventData?: ContainerChangeEventData];
  input: [value: string];
}>();

useAddField(props.prop);

const mForm = inject<FormState | undefined>('mForm');

const appendConfig = computed(() => {
  if (typeof props.config.append === 'string') {
    return {
      type: 'text',
      text: props.config.append,
      handler: undefined,
    };
  }
  if (typeof props.config.append === 'object') {
    if (typeof props.config.append?.handler === 'function') {
      return {
        type: 'button',
        text: props.config.append.text,
        handler: props.config.append.handler,
      };
    }
    if (props.config.append) {
      if (props.config.append.value === 0) {
        return false;
      }

      return props.config.append;
    }
  }

  return false;
});

const popoverVisible = ref(false);

const confirmTrimHandler = () => {
  emit('change', props.model[props.name].trim() || '');
  popoverVisible.value = false;
};

const checkWhiteSpace = debounce((value: unknown) => {
  if (typeof value === 'string' && !props.config.trim) {
    popoverVisible.value = value.trim() !== value;
  }
}, 300);

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
    const newChangeRecords: ChangeRecord[] = [];
    const setModel = (key: string, value: any) => {
      newChangeRecords.push({ propPath: props.prop.replace(`${props.name}`, key), value });
    };

    const setFormValue = (key: string, value: any) => {
      newChangeRecords.push({ propPath: key, value });
    };

    appendConfig.value.handler(mForm, {
      model: props.model,
      values: mForm ? readonly(mForm.initValues) : null,
      formValue: props.values || {},
      setModel,
      setFormValue,
    });

    if (newChangeRecords.length > 0) {
      emit('change', props.model[props.name], {
        changeRecords: newChangeRecords,
      });
    }
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

const popoverEl = ref<HTMLDivElement>();
const input = ref<InstanceType<typeof TMagicInput>>();
const instanceRef = shallowRef<Instance | undefined>();

watch(popoverEl, (el) => {
  destroyPopover();

  if (!input.value?.$el || !el) return;

  instanceRef.value = createPopper(input.value.$el, el, {
    placement: props.config.tooltip ? 'top' : 'bottom',
    strategy: 'absolute',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 10],
        },
      },
    ],
  });
});

const destroyPopover = () => {
  if (!instanceRef.value) return;

  instanceRef.value.destroy();
  instanceRef.value = undefined;
};
</script>
