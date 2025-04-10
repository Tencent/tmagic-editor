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
import { inject, nextTick, Ref, ref, watch, watchEffect } from 'vue';

import type { DataSourceSchema } from '@tmagic/core';
import { tMagicMessage } from '@tmagic/design';
import { type ContainerChangeEventData, type FormConfig, MFormBox } from '@tmagic/form';

import FloatingBox from '@editor/components/FloatingBox.vue';
import { useEditorContentHeight } from '@editor/hooks/use-editor-content-height';
import { useNextFloatBoxPosition } from '@editor/hooks/use-next-float-box-position';
import { useServices } from '@editor/hooks/use-services';

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

const emit = defineEmits<{
  submit: [v: any, eventData: ContainerChangeEventData];
  close: [];
  open: [id: string];
}>();

const { uiService, dataSourceService } = useServices();

const initValues = ref<Partial<DataSourceSchema>>({});
const dataSourceConfig = ref<FormConfig>([]);

const { height: editorHeight } = useEditorContentHeight();

const parentFloating = inject<Ref<HTMLDivElement | null>>('parentFloating', ref(null));
const { boxPosition, calcBoxPosition } = useNextFloatBoxPosition(uiService, parentFloating);

watchEffect(() => {
  initValues.value = props.values;
  dataSourceConfig.value = dataSourceService.getFormConfig(initValues.value.type);
});

const submitHandler = (values: any, data: ContainerChangeEventData) => {
  emit('submit', values, data);
};

const errorHandler = (error: any) => {
  tMagicMessage.error(error.message);
};

watch(boxVisible, (visible) => {
  nextTick(() => {
    if (!visible) {
      emit('close');
    } else if (initValues.value?.id) {
      emit('open', initValues.value.id);
    }
  });
});

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
