<template>
  <component
    :is="slideType === 'box' ? MFormBox : MFormDrawer"
    ref="fomDrawer"
    label-width="80px"
    :close-on-press-escape="false"
    :title="title"
    :width="size"
    :config="dataSourceConfig"
    :values="initValues"
    :disabled="disabled"
    @submit="submitHandler"
    @error="errorHandler"
  ></component>
</template>

<script setup lang="ts">
import { computed, inject, ref, watchEffect } from 'vue';

import { tMagicMessage } from '@tmagic/design';
import { FormConfig, MFormBox, MFormDrawer } from '@tmagic/form';
import { DataSourceSchema } from '@tmagic/schema';

import type { Services, SlideType } from '@editor/type';

defineOptions({
  name: 'MEditorDataSourceConfigPanel',
});

const props = defineProps<{
  title?: string;
  values: any;
  disabled: boolean;
  slideType?: SlideType;
}>();

const emit = defineEmits(['submit']);

const services = inject<Services>('services');

const size = computed(() => globalThis.document.body.clientWidth - (services?.uiService.get('columnWidth').left || 0));

const fomDrawer = ref<InstanceType<typeof MFormDrawer>>();

const initValues = ref<Partial<DataSourceSchema>>({});
const dataSourceConfig = ref<FormConfig>([]);

watchEffect(() => {
  initValues.value = props.values;
  dataSourceConfig.value = services?.dataSourceService.getFormConfig(initValues.value.type) || [];
});

const submitHandler = (values: any) => {
  emit('submit', values);
};

const errorHandler = (error: any) => {
  tMagicMessage.error(error.message);
};

defineExpose({
  show() {
    fomDrawer.value?.show();
  },

  hide() {
    fomDrawer.value?.hide();
  },
});
</script>
