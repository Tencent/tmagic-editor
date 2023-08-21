<template>
  <MFormDrawer
    ref="fomDrawer"
    label-width="80px"
    :close-on-press-escape="false"
    :title="title"
    :width="size"
    :config="dataSourceConfig"
    :values="initValues"
    :disabled="disabled"
    @change="changeHandler"
    @submit="submitHandler"
    @error="errorHandler"
  ></MFormDrawer>
</template>

<script setup lang="ts">
import { computed, inject, ref, watchEffect } from 'vue';
import { cloneDeep, mergeWith } from 'lodash-es';

import { tMagicMessage } from '@tmagic/design';
import { MFormDrawer } from '@tmagic/form';

import type { Services } from '@editor/type';

defineOptions({
  name: 'MEditorDataSourceConfigPanel',
});

const props = defineProps<{
  title?: string;
  values: any;
  disabled: boolean;
}>();

const type = ref('base');

const emit = defineEmits(['submit']);

const services = inject<Services>('services');

const size = computed(() => globalThis.document.body.clientWidth - (services?.uiService.get('columnWidth').left || 0));

const dataSourceConfig = computed(() => services?.dataSourceService.getFormConfig(type.value) || []);

const fomDrawer = ref<InstanceType<typeof MFormDrawer>>();

const initValues = ref({});

watchEffect(() => {
  initValues.value = props.values;
  type.value = props.values.type || 'base';
});

const changeHandler = (value: Record<string, any>) => {
  if (value.type === type.value) {
    return;
  }
  type.value = value.type || 'base';

  initValues.value = mergeWith(
    cloneDeep(value),
    services?.dataSourceService.getFormValue(type.value) || {},
    (objValue, srcValue) => {
      if (Array.isArray(srcValue)) {
        return srcValue;
      }
    },
  );
};

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
