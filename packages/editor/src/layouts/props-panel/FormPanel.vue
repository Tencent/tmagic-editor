<template>
  <div class="m-editor-props-form-panel">
    <slot name="props-form-panel-header"></slot>

    <TMagicScrollbar>
      <MForm
        ref="configForm"
        :class="propsPanelSize"
        :popper-class="`m-editor-props-panel-popper ${propsPanelSize}`"
        :label-width="labelWidth"
        :label-position="labelPosition"
        :size="propsPanelSize"
        :init-values="values"
        :config="config"
        :extend-state="extendState"
        @change="submit"
        @error="errorHandler"
      ></MForm>
    </TMagicScrollbar>

    <TMagicButton
      v-if="!disabledShowSrc"
      class="m-editor-props-panel-src-icon"
      circle
      title="源码"
      :type="showSrc ? 'primary' : ''"
      @click="showSrc = !showSrc"
    >
      <MIcon :icon="DocumentIcon"></MIcon>
    </TMagicButton>

    <CodeEditor
      v-if="showSrc"
      class="m-editor-props-panel-src-code"
      :height="`${editorContentHeight}px`"
      :init-values="codeValueKey ? values[codeValueKey] : values"
      :options="codeOptions"
      :parse="true"
      @save="saveCode"
    ></CodeEditor>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, inject, onMounted, ref, useTemplateRef, watchEffect } from 'vue';
import { Document as DocumentIcon } from '@element-plus/icons-vue';

import { TMagicButton, TMagicScrollbar } from '@tmagic/design';
import type { ContainerChangeEventData, FormConfig, FormState, FormValue } from '@tmagic/form';
import { MForm } from '@tmagic/form';

import MIcon from '@editor/components/Icon.vue';
import { useEditorContentHeight } from '@editor/hooks/use-editor-content-height';
import type { Services } from '@editor/type';

import CodeEditor from '../CodeEditor.vue';

defineSlots<{
  'props-form-panel-header'(props: {}): any;
}>();

defineOptions({
  name: 'MEditorFormPanel',
});

const props = defineProps<{
  config: FormConfig;
  values: FormValue;
  disabledShowSrc?: boolean;
  labelWidth?: string;
  codeValueKey?: string;
  labelPosition?: string;
  extendState?: (state: FormState) => Record<string, any> | Promise<Record<string, any>>;
}>();

const emit = defineEmits<{
  submit: [values: any, eventData?: ContainerChangeEventData];
  'submit-error': [e: any];
  'form-error': [e: any];
  mounted: [internalInstance: any];
}>();

const services = inject<Services>('services');
const codeOptions = inject('codeOptions', {});

const showSrc = ref(false);
const propsPanelSize = computed(() => services?.uiService.get('propsPanelSize') || 'small');
const { height: editorContentHeight } = useEditorContentHeight();
const stage = computed(() => services?.editorService.get('stage'));

const configForm = useTemplateRef<InstanceType<typeof MForm>>('configForm');

watchEffect(() => {
  if (configForm.value) {
    configForm.value.formState.stage = stage.value;
    configForm.value.formState.services = services;
  }
});

const internalInstance = getCurrentInstance();
onMounted(() => {
  emit('mounted', internalInstance);
});

const submit = async (v: FormValue, eventData: ContainerChangeEventData) => {
  try {
    const values = await configForm.value?.submitForm();
    emit('submit', values, eventData);
  } catch (e: any) {
    emit('submit-error', e);
  }
};

const errorHandler = (e: any) => {
  emit('form-error', e);
};

const saveCode = (values: any) => {
  emit('submit', props.codeValueKey ? { [props.codeValueKey]: values } : values);
};

defineExpose({ configForm, submit });
</script>
