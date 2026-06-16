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
import { computed, inject, nextTick, provide, Ref, ref, watch, watchEffect } from 'vue';

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
  /** 打开后需要直接定位并打开的方法名，传入时默认激活「方法定义」tab */
  editMethodName?: string;
  /** 打开后需要直接定位并打开的字段路径，传入时默认激活「数据定义」tab */
  editFieldPath?: string[];
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

/** 供「方法定义」tab 内的字段消费，用于打开数据源详情后自动打开指定方法 */
provide(
  'editingDataSourceMethodName',
  computed(() => props.editMethodName),
);

/** 供「数据定义」tab 内的字段消费，用于打开数据源详情后自动打开指定字段 */
provide(
  'editingDataSourceFieldPath',
  computed(() => props.editFieldPath || []),
);

watchEffect(() => {
  initValues.value = props.values;
  const config = dataSourceService.getFormConfig(initValues.value.type);

  // 传入方法名/字段路径时，将外层 tab 容器默认激活到对应 tab（status: methods / fields）
  // 未传入时默认激活「数据定义」tab（fields）
  let activeTab = 'fields';
  if (props.editMethodName) {
    activeTab = 'methods';
  } else if (props.editFieldPath?.length) {
    activeTab = 'fields';
  }

  dataSourceConfig.value = config.map((item) =>
    (item as { type?: string }).type === 'tab' ? { ...item, active: activeTab } : item,
  );
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
