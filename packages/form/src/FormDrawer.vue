<template>
  <TMagicDrawer
    class="m-form-drawer"
    ref="drawer"
    v-model="visible"
    :title="title"
    :close-on-press-escape="closeOnPressEscape"
    :append-to-body="true"
    :show-close="true"
    :close-on-click-modal="true"
    :size="width"
    :zIndex="zIndex"
    :before-close="beforeClose"
    @open="openHandler"
    @opened="openedHandler"
    @close="closeHandler"
    @closed="closedHandler"
  >
    <div v-if="visible" ref="drawerBody" class="m-drawer-body">
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

    <template #footer>
      <TMagicRow class="dialog-footer">
        <TMagicCol :span="12" style="text-align: left">
          <div style="min-height: 1px">
            <slot name="left"></slot>
          </div>
        </TMagicCol>
        <TMagicCol :span="12">
          <slot name="footer">
            <TMagicButton @click="handleClose">关闭</TMagicButton>
            <TMagicButton type="primary" :disabled="disabled" :loading="saveFetch" @click="submitHandler">{{
              confirmText
            }}</TMagicButton>
          </slot>
        </TMagicCol>
      </TMagicRow>
    </template>
  </TMagicDrawer>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';

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
    closeOnPressEscape?: boolean;
    title?: string;
    zIndex?: number;
    size?: 'small' | 'default' | 'large';
    confirmText?: string;
    inline?: boolean;
    labelPosition?: string;
    /** 关闭前的回调，会暂停 Drawer 的关闭; done 是个 function type 接受一个 boolean 参数, 执行 done 使用 true 参数或不提供参数将会终止关闭 */
    beforeClose?: (done: (cancel?: boolean) => void) => void;
  }>(),
  {
    closeOnPressEscape: true,
    config: () => [],
    values: () => ({}),
    confirmText: '确定',
  },
);

const emit = defineEmits(['close', 'closed', 'submit', 'error', 'change', 'open', 'opened']);

const drawer = ref<InstanceType<typeof TMagicDrawer>>();
const form = ref<InstanceType<typeof Form>>();
const drawerBody = ref<HTMLDivElement>();
const visible = ref(false);
const saveFetch = ref(false);
const bodyHeight = ref(0);

watchEffect(() => {
  if (drawerBody.value) {
    bodyHeight.value = drawerBody.value.clientHeight;
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

const openHandler = () => {
  emit('open');
};

const openedHandler = () => {
  emit('opened');
};

const closeHandler = () => {
  emit('close');
};

const closedHandler = () => {
  emit('closed');
};

const show = () => {
  visible.value = true;
};

const hide = () => {
  visible.value = false;
};

/** 用于关闭 Drawer, 该方法会调用传入的 before-close 方法 */
const handleClose = () => {
  drawer.value?.handleClose();
};

defineExpose({
  form,
  saveFetch,
  bodyHeight,

  show,
  hide,
  handleClose,
});
</script>
