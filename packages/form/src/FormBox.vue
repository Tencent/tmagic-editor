<template>
  <div class="m-form-box">
    <div ref="boxBody" class="m-box-body">
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
    </div>

    <TMagicRow class="dialog-footer">
      <TMagicCol :span="12" style="text-align: left">
        <div style="min-height: 1px">
          <slot name="left"></slot>
        </div>
      </TMagicCol>
      <TMagicCol :span="12">
        <slot name="footer">
          <TMagicButton type="primary" :disabled="disabled" :loading="saveFetch" @click="submitHandler">{{
            confirmText
          }}</TMagicButton>
        </slot>
      </TMagicCol>
    </TMagicRow>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';

import { TMagicButton, TMagicCol, TMagicRow } from '@tmagic/design';

import Form from './Form.vue';
import type { FormConfig } from './schema';

defineOptions({
  name: 'MFormDialog',
});

withDefaults(
  defineProps<{
    config?: FormConfig;
    values?: Object;
    parentValues?: Object;
    width?: string | number;
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

const form = ref<InstanceType<typeof Form>>();
const boxBody = ref<HTMLDivElement>();
const saveFetch = ref(false);
const bodyHeight = ref(0);

watchEffect(() => {
  if (boxBody.value) {
    bodyHeight.value = boxBody.value.clientHeight;
  }
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
  bodyHeight,

  show,
  hide,
});
</script>
