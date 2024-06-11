<template>
  <div class="m-editor-props-panel" v-show="nodes.length === 1">
    <slot name="props-panel-header"></slot>
    <MForm
      ref="configForm"
      :class="propsPanelSize"
      :popper-class="`m-editor-props-panel-popper ${propsPanelSize}`"
      :size="propsPanelSize"
      :init-values="values"
      :config="curFormConfig"
      :extend-state="extendState"
      @change="submit"
      @error="errorHandler"
    ></MForm>

    <TMagicButton
      v-if="!disabledShowSrc"
      class="m-editor-props-panel-src-icon"
      circle
      size="large"
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
      :init-values="values"
      :options="codeOptions"
      :parse="true"
      @save="saveCode"
    ></CodeEditor>
  </div>
</template>

<script lang="ts" setup>
import { computed, getCurrentInstance, inject, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';
import { Document as DocumentIcon } from '@element-plus/icons-vue';

import { TMagicButton } from '@tmagic/design';
import type { FormState, FormValue } from '@tmagic/form';
import { MForm } from '@tmagic/form';
import type { MNode } from '@tmagic/schema';

import MIcon from '@editor/components/Icon.vue';
import { useEditorContentHeight } from '@editor/hooks/use-editor-content-height';
import type { PropsPanelSlots, Services } from '@editor/type';

import CodeEditor from './CodeEditor.vue';

defineSlots<PropsPanelSlots>();

defineOptions({
  name: 'MEditorPropsPanel',
});

defineProps<{
  disabledShowSrc?: boolean;
  extendState?: (state: FormState) => Record<string, any> | Promise<Record<string, any>>;
}>();

const codeOptions = inject('codeOptions', {});

const emit = defineEmits(['mounted', 'submit-error', 'form-error']);

const showSrc = ref(false);

const internalInstance = getCurrentInstance();
const values = ref<FormValue>({});
const configForm = ref<InstanceType<typeof MForm>>();
// ts类型应该是FormConfig， 但是打包时会出错，所以暂时用any
const curFormConfig = ref<any>([]);
const services = inject<Services>('services');
const node = computed(() => services?.editorService.get('node'));
const nodes = computed(() => services?.editorService.get('nodes') || []);
const propsPanelSize = computed(() => services?.uiService.get('propsPanelSize') || 'small');
const stage = computed(() => services?.editorService.get('stage'));

const { height: editorContentHeight } = useEditorContentHeight();

const init = async () => {
  if (!node.value) {
    curFormConfig.value = [];
    return;
  }

  const type = node.value.type || (node.value.items ? 'container' : 'text');
  curFormConfig.value = (await services?.propsService.getPropsConfig(type)) || [];
  values.value = node.value;
};

watchEffect(init);
services?.propsService.on('props-configs-change', init);

onMounted(() => {
  emit('mounted', internalInstance);
});

onBeforeUnmount(() => {
  services?.propsService.off('props-configs-change', init);
});

watchEffect(() => {
  if (configForm.value && stage.value) {
    configForm.value.formState.stage = stage.value;
  }
});

const submit = async () => {
  try {
    const values = await configForm.value?.submitForm();
    services?.editorService.update(values);
  } catch (e: any) {
    emit('submit-error', e);
  }
};

const errorHandler = (e: any) => {
  emit('form-error', e);
};

const saveCode = (values: MNode) => {
  services?.editorService.update(values);
};

defineExpose({ configForm, submit });
</script>
