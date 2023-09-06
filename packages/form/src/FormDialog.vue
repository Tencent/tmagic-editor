<template>
  <TMagicDialog
    v-model="dialogVisible"
    class="m-form-dialog"
    top="20px"
    append-to-body
    :title="title"
    :width="width"
    :zIndex="zIndex"
    :fullscreen="fullscreen"
    :close-on-click-modal="false"
    @close="closeHandler"
  >
    <div
      v-if="dialogVisible"
      class="m-dialog-body"
      :style="`max-height: ${bodyHeight}; overflow-y: auto; overflow-x: hidden;`"
    >
      <Form
        v-model="stepActive"
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

    <template #footer>
      <TMagicRow class="dialog-footer">
        <TMagicCol :span="12" style="text-align: left">
          <div style="min-height: 1px">
            <slot name="left"></slot>
          </div>
        </TMagicCol>
        <TMagicCol :span="12">
          <slot name="footer">
            <TMagicButton @click="cancel" size="small">取 消</TMagicButton>
            <TMagicButton v-if="hasStep && stepActive > 1" type="info" size="small" @click="preStep"
              >上一步</TMagicButton
            >
            <TMagicButton v-if="hasStep && stepCount > stepActive" type="info" size="small" @click="nextStep"
              >下一步</TMagicButton
            >
            <TMagicButton v-else type="primary" size="small" :disabled="disabled" :loading="saveFetch" @click="save">{{
              confirmText
            }}</TMagicButton>
          </slot>
        </TMagicCol>
      </TMagicRow>
    </template>
  </TMagicDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { TMagicButton, TMagicCol, TMagicDialog, TMagicRow } from '@tmagic/design';

import Form from './Form.vue';
import { FormConfig, StepConfig } from './schema';

defineOptions({
  name: 'MFormDialog',
});

const props = withDefaults(
  defineProps<{
    config?: FormConfig;
    values?: Object;
    parentValues?: Object;
    width?: string | number;
    labelWidth?: string;
    fullscreen?: boolean;
    disabled?: boolean;
    title?: string;
    inline?: boolean;
    labelPosition?: string;
    zIndex?: number;
    size?: 'small' | 'default' | 'large';
    confirmText?: string;
  }>(),
  {
    config: () => [],
    values: () => ({}),
    confirmText: '确定',
  },
);

const emit = defineEmits(['close', 'submit', 'error', 'change']);

const form = ref<InstanceType<typeof Form>>();
const dialogVisible = ref(false);
const saveFetch = ref(false);
const stepActive = ref(1);
const bodyHeight = ref(`${document.body.clientHeight - 194}px`);

const stepCount = computed(() => {
  const { length } = props.config;
  for (let index = 0; index < length; index++) {
    if (props.config[index].type === 'step') {
      return (props.config[index] as StepConfig).items.length;
    }
  }
  return 0;
});

const hasStep = computed(() => {
  const { length } = props.config;
  for (let index = 0; index < length; index++) {
    if (props.config[index].type === 'step') {
      return true;
    }
  }

  return false;
});

const closeHandler = () => {
  stepActive.value = 1;
  emit('close');
};

const save = async () => {
  try {
    const values = await form.value?.submitForm();
    emit('submit', values);
  } catch (e) {
    emit('error', e);
  }
};

const preStep = () => {
  stepActive.value -= 1;
};

const nextStep = () => {
  stepActive.value += 1;
};

const changeHandler = (value: any) => {
  emit('change', value);
};

const show = () => {
  dialogVisible.value = true;
};

const hide = () => {
  dialogVisible.value = false;
};

const cancel = () => {
  hide();
};

defineExpose({
  form,
  saveFetch,
  dialogVisible,

  cancel,
  save,
  show,
  hide,
});
</script>
