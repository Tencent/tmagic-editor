<template>
  <div class="`m-editor-props-panel">
    <slot name="props-panel-header"></slot>
    <m-form
      :class="`m-editor-props-panel ${propsPanelSize}`"
      :popper-class="`m-editor-props-panel-popper ${propsPanelSize}`"
      ref="configForm"
      :size="propsPanelSize"
      :init-values="values"
      :config="curFormConfig"
      @change="submit"
    ></m-form>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, getCurrentInstance, inject, onMounted, ref, watchEffect } from 'vue';
import { ElMessage } from 'element-plus';

import type { FormValue, MForm } from '@tmagic/form';
import type { MNode } from '@tmagic/schema';

import type { Services } from '../type';

export default defineComponent({
  name: 'm-editor-props-panel',

  emits: ['mounted'],

  setup(props, { emit }) {
    const internalInstance = getCurrentInstance();
    const values = ref<FormValue>({});
    const configForm = ref<InstanceType<typeof MForm>>();
    // ts类型应该是FormConfig， 但是打包时会出错，所以暂时用any
    const curFormConfig = ref<any>([]);
    const services = inject<Services>('services');
    const node = computed(() => services?.editorService.get<MNode | null>('node'));

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

    return {
      values,
      configForm,
      curFormConfig,
      propsPanelSize: computed(() => services?.uiService.get('propsPanelSize') || 'small'),

      async submit() {
        try {
          const values = await configForm.value?.submitForm();
          services?.editorService.update(values);
        } catch (e: any) {
          console.error(e);
          ElMessage.closeAll();
          ElMessage.error({
            duration: 10000,
            showClose: true,
            message: e.message,
            dangerouslyUseHTMLString: true,
          });
        }
      },
    };
  },
});
</script>
