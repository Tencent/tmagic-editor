<template>
  <div class="m-form-box" :style="style">
    <div class="m-box-body" :style="bodyHeight ? { height: `${bodyHeight}px` } : {}">
      <TMagicScrollbar>
        <Form
          ref="form"
          :size="size"
          :disabled="disabled"
          :config="config"
          :init-values="values"
          :parent-values="parentValues"
          :label-width="labelWidth"
          :label-position="labelPosition"
          :inline="inline"
          @change="changeHandler"
        ></Form>
        <slot></slot>
      </TMagicScrollbar>
    </div>

    <div class="dialog-footer" :style="`height: ${footerHeight}px`">
      <div>
        <slot name="left"></slot>
      </div>
      <div>
        <slot name="footer">
          <TMagicButton type="primary" :size="size" :disabled="disabled" :loading="saveFetch" @click="submitHandler">{{
            confirmText
          }}</TMagicButton>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';

import { TMagicButton, TMagicScrollbar } from '@tmagic/design';

import Form from './Form.vue';
import type { FormConfig } from './schema';

defineOptions({
  name: 'MFormBox',
});

const props = withDefaults(
  defineProps<{
    config?: FormConfig;
    values?: Object;
    parentValues?: Object;
    width?: number;
    height?: number;
    labelWidth?: string;
    disabled?: boolean;
    size?: 'small' | 'default' | 'large';
    confirmText?: string;
    inline?: boolean;
    labelPosition?: string;
  }>(),
  {
    config: () => [],
    values: () => ({}),
    confirmText: '确定',
  },
);

const emit = defineEmits(['submit', 'change', 'error']);

const footerHeight = 60;

const style = computed(() => {
  const style: { width?: string; height?: string } = {};
  if (typeof props.width === 'number') {
    style.width = `${props.width}px`;
  }
  if (typeof props.height === 'number') {
    style.height = `${props.height}px`;
  }
  return style;
});

const form = ref<InstanceType<typeof Form>>();
const saveFetch = ref(false);

const bodyHeight = ref(0);

watchEffect(() => {
  if (!props.height) {
    return;
  }
  bodyHeight.value = props.height - footerHeight;
});

const submitHandler = async () => {
  try {
    const values = await form.value?.submitForm();
    emit('submit', values);
  } catch (e) {
    emit('error', e);
  }
};

const changeHandler = (value: any) => {
  emit('change', value);
};

const show = () => {};

const hide = () => {};

defineExpose({
  form,
  saveFetch,

  show,
  hide,
});
</script>
