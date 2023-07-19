<template>
  <MFormDrawer
    ref="fomDrawer"
    label-width="80px"
    :title="content.name"
    :width="size"
    :config="functionConfig"
    :values="content"
    :disabled="disabled"
    @submit="submitForm"
    @error="errorHandler"
    @open="openHandler"
  ></MFormDrawer>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';

import { tMagicMessage } from '@tmagic/design';
import { ColumnConfig, FormState, MFormDrawer } from '@tmagic/form';
import type { CodeBlockContent } from '@tmagic/schema';

import type { Services } from '@editor/type';
import { getConfig } from '@editor/utils/config';

defineOptions({
  name: 'MEditorCodeBlockEditor',
});

defineProps<{
  content: CodeBlockContent;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  submit: [values: CodeBlockContent];
}>();

const services = inject<Services>('services');

const columnWidth = computed(() => services?.uiService.get('columnWidth'));
const size = computed(() => (columnWidth.value ? columnWidth.value.center + columnWidth.value.right : 600));

const codeEditorHeight = ref('600px');

const defaultParamColConfig: ColumnConfig = {
  type: 'row',
  label: '参数类型',
  items: [
    {
      text: '参数类型',
      labelWidth: '70px',
      type: 'select',
      name: 'type',
      options: [
        {
          text: '数字',
          label: '数字',
          value: 'number',
        },
        {
          text: '字符串',
          label: '字符串',
          value: 'text',
        },
        {
          text: '组件',
          label: '组件',
          value: 'ui-select',
        },
      ],
    },
  ],
};

const functionConfig = computed(() => [
  {
    text: '名称',
    name: 'name',
  },
  {
    text: '注释',
    name: 'desc',
  },
  {
    type: 'table',
    border: true,
    text: '参数',
    enableFullscreen: false,
    name: 'params',
    maxHeight: '300px',
    dropSort: false,
    items: [
      {
        type: 'text',
        label: '参数名',
        name: 'name',
      },
      {
        type: 'text',
        label: '注释',
        name: 'extra',
      },
      services?.codeBlockService.getParamsColConfig() || defaultParamColConfig,
    ],
  },
  {
    name: 'content',
    type: 'vs-code',
    options: inject('codeOptions', {}),
    height: codeEditorHeight.value,
    onChange: (formState: FormState | undefined, code: string) => {
      try {
        // 检测js代码是否存在语法错误
        getConfig('parseDSL')(code);

        return code;
      } catch (error: any) {
        tMagicMessage.error(error.message);

        throw error;
      }
    },
  },
]);

const submitForm = async (values: CodeBlockContent) => {
  emit('submit', values);
};

const errorHandler = (error: any) => {
  tMagicMessage.error(error.message);
};

const fomDrawer = ref<InstanceType<typeof MFormDrawer>>();

const openHandler = () => {
  setTimeout(() => {
    if (fomDrawer.value) {
      const height = fomDrawer.value?.bodyHeight - 468;
      codeEditorHeight.value = `${height > 100 ? height : 600}px`;
    }
  });
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
