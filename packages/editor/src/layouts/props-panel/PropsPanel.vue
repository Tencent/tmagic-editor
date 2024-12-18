<template>
  <div class="m-editor-props-panel" v-show="nodes.length === 1">
    <slot name="props-panel-header"></slot>
    <FormPanel
      ref="propertyFormPanel"
      class="m-editor-props-property-panel"
      :class="{ 'show-style-panel': showStylePanel }"
      :config="curFormConfig"
      :values="values"
      :disabledShowSrc="disabledShowSrc"
      :extendState="extendState"
      @submit="submit"
      @submit-error="errorHandler"
      @form-error="errorHandler"
      @mounted="mountedHandler"
    ></FormPanel>

    <FormPanel
      v-if="showStylePanel"
      class="m-editor-props-style-panel"
      label-position="top"
      code-value-key="style"
      :config="styleFormConfig"
      :values="values"
      :disabledShowSrc="disabledShowSrc"
      :extendState="extendState"
      @submit="submit"
      @submit-error="errorHandler"
      @form-error="errorHandler"
    >
      <template #props-form-panel-header>
        <div class="m-editor-props-style-panel-title">
          <span>样式</span>
          <div>
            <TMagicButton link size="small" @click="closeStylePanelHandler"><MIcon :icon="Close"></MIcon></TMagicButton>
          </div>
        </div>
      </template>
    </FormPanel>

    <TMagicButton
      v-if="!showStylePanel"
      class="m-editor-props-panel-style-icon"
      circle
      :type="showStylePanel ? 'primary' : ''"
      @click="showStylePanelHandler"
    >
      <MIcon :icon="Sugar"></MIcon>
    </TMagicButton>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, onBeforeUnmount, ref, useTemplateRef, watchEffect } from 'vue';
import { Close, Sugar } from '@element-plus/icons-vue';

import type { MNode } from '@tmagic/core';
import { TMagicButton } from '@tmagic/design';
import type { ContainerChangeEventData, FormState, FormValue } from '@tmagic/form';

import MIcon from '@editor/components/Icon.vue';
import type { PropsPanelSlots, Services } from '@editor/type';
import { styleTabConfig } from '@editor/utils';

import FormPanel from './FormPanel.vue';
import { useStylePanel } from './use-style-panel';

defineSlots<PropsPanelSlots>();

defineOptions({
  name: 'MEditorPropsPanel',
});

defineProps<{
  disabledShowSrc?: boolean;
  extendState?: (state: FormState) => Record<string, any> | Promise<Record<string, any>>;
}>();

const emit = defineEmits<{
  'submit-error': [e: any];
  'form-error': [e: any];
  mounted: [internalInstance: InstanceType<typeof FormPanel>];
}>();

const services = inject<Services>('services');

const values = ref<FormValue>({});
// ts类型应该是FormConfig， 但是打包时会出错，所以暂时用any
const curFormConfig = ref<any>([]);
const node = computed(() => services?.editorService.get('node'));
const nodes = computed(() => services?.editorService.get('nodes') || []);

const styleFormConfig = [
  {
    tabPosition: 'right',
    items: styleTabConfig.items,
  },
];

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

onBeforeUnmount(() => {
  services?.propsService.off('props-configs-change', init);
});

const submit = async (v: MNode, eventData?: ContainerChangeEventData) => {
  try {
    if (!v.id) {
      v.id = values.value.id;
    }
    services?.editorService.update(v, { changeRecords: eventData?.changeRecords });
  } catch (e: any) {
    emit('submit-error', e);
  }
};

const errorHandler = (e: any) => {
  emit('form-error', e);
};

const mountedHandler = (e: InstanceType<typeof FormPanel>) => {
  emit('mounted', e);
};

const { showStylePanel, showStylePanelHandler, closeStylePanelHandler } = useStylePanel(services);

const propertyFormPanelRef = useTemplateRef<InstanceType<typeof FormPanel>>('propertyFormPanel');
defineExpose({
  getFormState() {
    return propertyFormPanelRef.value?.configForm?.formState;
  },
  submit,
});
</script>
