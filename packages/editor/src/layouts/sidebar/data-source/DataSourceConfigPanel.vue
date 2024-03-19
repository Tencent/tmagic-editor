<template>
  <FloatingBox
    v-model:visible="boxVisible"
    v-model:width="width"
    v-model:height="editorHeight"
    :title="title"
    :position="boxPosition"
  >
    <template #body>
      <MFormBox
        label-width="80px"
        :title="title"
        :config="dataSourceConfig"
        :values="initValues"
        :disabled="disabled"
        style="height: 100%"
        @submit="submitHandler"
        @error="errorHandler"
      ></MFormBox>
    </template>
  </FloatingBox>
</template>

<script setup lang="ts">
import { inject, Ref, ref, watchEffect } from 'vue';

import { tMagicMessage } from '@tmagic/design';
import { FormConfig, MFormBox } from '@tmagic/form';
import { DataSourceSchema } from '@tmagic/schema';

import FloatingBox from '@editor/components/FloatingBox.vue';
import { useEditorContentHeight } from '@editor/hooks';
import { useNextFloatBoxPosition } from '@editor/hooks/use-next-float-box-position';
import type { Services } from '@editor/type';

defineOptions({
  name: 'MEditorDataSourceConfigPanel',
});

const props = defineProps<{
  title?: string;
  values: any;
  disabled: boolean;
}>();

const boxVisible = defineModel<boolean>('visible', { default: false });
const width = defineModel<number>('width', { default: 670 });

const emit = defineEmits(['submit']);

const services = inject<Services>('services');

const initValues = ref<Partial<DataSourceSchema>>({});
const dataSourceConfig = ref<FormConfig>([]);

const { height: editorHeight } = useEditorContentHeight();

const parentFloating = inject<Ref<HTMLDivElement | null>>('parentFloating', ref(null));
const { boxPosition, calcBoxPosition } = useNextFloatBoxPosition(services?.uiService, parentFloating);

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
    calcBoxPosition();
    boxVisible.value = true;
  },

  hide() {
    boxVisible.value = false;
  },
});
</script>
