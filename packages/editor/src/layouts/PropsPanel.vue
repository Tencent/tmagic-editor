<template>
  <div class="m-editor-props-panel">
    <slot name="props-panel-header"></slot>
    <MForm
      ref="configForm"
      :class="`m-editor-props-panel ${propsPanelSize}`"
      :popper-class="`m-editor-props-panel-popper ${propsPanelSize}`"
      :size="propsPanelSize"
      :init-values="values"
      :config="curFormConfig"
      @change="submit"
    ></MForm>
  </div>
</template>

<script lang="ts" setup name="MEditorPropsPanel">
import { computed, getCurrentInstance, inject, onMounted, onUnmounted, ref, watchEffect } from 'vue';

import { tMagicMessage } from '@tmagic/design';
import type { FormValue } from '@tmagic/form';
import { MForm } from '@tmagic/form';

import type { Services } from '@editor/type';

const emit = defineEmits(['mounted']);

const internalInstance = getCurrentInstance();
const values = ref<FormValue>({});
const configForm = ref<InstanceType<typeof MForm>>();
// ts类型应该是FormConfig， 但是打包时会出错，所以暂时用any
const curFormConfig = ref<any>([]);
const services = inject<Services>('services');
const node = computed(() => services?.editorService.get('node'));
const propsPanelSize = computed(() => services?.uiService.get('propsPanelSize') || 'small');
const stage = computed(() => services?.editorService.get('stage'));

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

onUnmounted(() => {
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
    console.error(e);
    tMagicMessage.closeAll();
    tMagicMessage.error(e.message);
  }
};

defineExpose({ submit });
</script>
