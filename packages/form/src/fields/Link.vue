<template>
  <a v-if="config.href && !disabled" target="_blank" :href="href" :style="config.css || {}">{{ displayText }}</a>
  <span v-else-if="config.href && disabled" :style="config.disabledCss || {}">{{ displayText }}</span>
  <div v-else class="m-fields-link">
    <TMagicButton link type="primary" @click="editHandler">点击编辑</TMagicButton>
    <FormDialog
      ref="editor"
      :title="config.formTitle || '编辑扩展配置'"
      :width="config.formWidth"
      :values="formValue"
      :config="formConfig"
      :parentValues="values"
      :fullscreen="config.fullscreen"
      @submit="action"
    ></FormDialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';

import { TMagicButton } from '@tmagic/design';

import FormDialog from '../FormDialog.vue';
import type { FieldProps, FormState, LinkConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormLink',
});

const props = defineProps<FieldProps<LinkConfig>>();

const emit = defineEmits(['change']);

useAddField(props.prop);

const formValue = ref({});
const editor = ref<InstanceType<typeof FormDialog>>();
const mForm = inject<FormState | undefined>('mForm');

const href = computed(() => {
  if (typeof props.config.href === 'function' && props.model) {
    return props.config.href(props.model);
  }
  return props.config.href || props.model?.[props.name];
});

const init = () => {
  formValue.value = props.model?.[props.name] || {};
};

const formConfig = computed(() => {
  if (typeof props.config.form === 'function') {
    return props.config.form(mForm, {
      model: props.model || {},
      values: props.values || {},
    });
  }
  return props.config.form;
});

const displayText = computed(() => {
  if (typeof props.config.displayText === 'function') {
    return props.config.displayText(mForm, { model: props.model || {} });
  }
  if (props.config.displayText) {
    return props.config.displayText;
  }
  return '跳转';
});

const editHandler = () => {
  init();
  editor.value && (editor.value.dialogVisible = true);
};

const action = (data: any) => {
  if (props.model) {
    props.model[props.name] = data;
    formValue.value = data;
    emit('change', props.model[props.name]);
  }
  editor.value && (editor.value.dialogVisible = false);
};
</script>
