<template>
  <m-form
    class="m-editor-props-panel"
    ref="configForm"
    size="small"
    :init-values="values"
    :config="curFormConfig"
    @change="submit"
  ></m-form>
</template>

<script lang="ts">
import { defineComponent, getCurrentInstance, inject, onMounted, ref, watchEffect } from 'vue';
import { ElMessage } from 'element-plus';

import type { FormValue, MForm } from '@tmagic/form';
import type { MNode } from '@tmagic/schema';

import type { Services } from '@editor/type';

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

    const init = async () => {
      const node = services?.editorService.get<MNode | null>('node');

      if (!node) {
        curFormConfig.value = [];
        return;
      }

      if (node.devconfig && node.style && !isNaN(+node.style.height) && !isNaN(+node.style.width)) {
        node.devconfig.ratio = node.style.height / node.style.width || 1;
      }

      values.value = node;
      const type = node.type || (node.items ? 'container' : 'text');
      curFormConfig.value = (await services?.propsService.getPropsConfig(type)) || [];
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
