<template>
  <TMagicDrawer
    class="m-form-drawer"
    v-model="visible"
    :title="title"
    :close-on-press-escape="true"
    :append-to-body="true"
    :show-close="true"
    :close-on-click-modal="true"
    :size="width"
    :zIndex="zIndex"
  >
    <div
      v-if="visible"
      class="m-drawer-body"
      :style="`max-height: ${bodyHeight}; overflow-y: auto; overflow-x: hidden;`"
    >
      <Form
        ref="form"
        :size="size"
        :disabled="disabled"
        :config="config"
        :init-values="values"
        :parent-values="parentValues"
        :label-width="labelWidth"
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
            <TMagicButton @click="hide">关闭</TMagicButton>
            <TMagicButton type="primary" @click="submitHandler" :loading="saveFetch">{{ confirmText }}</TMagicButton>
          </slot>
        </TMagicCol>
      </TMagicRow>
    </template>
  </TMagicDrawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { TMagicButton, TMagicCol, TMagicDrawer, TMagicRow } from '@tmagic/design';

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
    title?: string;
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
const visible = ref(false);
const saveFetch = ref(false);
const bodyHeight = ref(`${document.body.clientHeight - 194}px`);

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

const show = () => {
  visible.value = true;
};

const hide = () => {
  visible.value = false;
};

defineExpose({
  form,
  saveFetch,

  show,
  hide,
});
</script>
