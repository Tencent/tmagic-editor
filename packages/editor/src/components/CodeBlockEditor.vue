<template>
  <!-- 代码块编辑区 -->
  <FloatingBox v-model:visible="boxVisible" title="代码编辑" :position="boxPosition" :before-close="beforeClose">
    <template #body>
      <div ref="floatingBoxBody"></div>
    </template>
  </FloatingBox>

  <Teleport :to="floatingBoxBody" :disabled="slideType === 'box'" v-if="editVisible">
    <MFormBox
      class="m-editor-code-block-editor"
      ref="fomDrawer"
      label-width="80px"
      :close-on-press-escape="false"
      :title="content.name"
      :width="size"
      :config="functionConfig"
      :values="content"
      :disabled="disabled"
      @change="changeHandler"
      @submit="submitForm"
      @error="errorHandler"
      @open="openHandler"
      @closed="closedHandler"
    >
      <template #left>
        <TMagicButton type="primary" link @click="difVisible = true">查看修改</TMagicButton>
      </template>
    </MFormBox>
  </Teleport>

  <TMagicDialog v-model="difVisible" title="查看修改" fullscreen>
    <div style="display: flex; margin-bottom: 10px">
      <div style="flex: 1"><TMagicTag size="small" type="info">修改前</TMagicTag></div>
      <div style="flex: 1"><TMagicTag size="small" type="success">修改后</TMagicTag></div>
    </div>

    <CodeEditor
      v-if="difVisible"
      ref="magicVsEditor"
      type="diff"
      language="json"
      :initValues="content.content"
      :modifiedValues="fomDrawer?.form?.values.content"
      :style="`height: ${height - 200}px`"
    ></CodeEditor>

    <template #footer>
      <span class="dialog-footer">
        <TMagicButton size="small" @click="difVisible = false">取消</TMagicButton>
        <TMagicButton size="small" type="primary" @click="diffChange">确定</TMagicButton>
      </span>
    </template>
  </TMagicDialog>
</template>

<script lang="ts" setup>
import { computed, inject, nextTick, onBeforeUnmount, ref } from 'vue';

import { TMagicButton, TMagicDialog, tMagicMessage, tMagicMessageBox, TMagicTag } from '@tmagic/design';
import { ColumnConfig, FormConfig, FormState, MFormBox, MFormDrawer } from '@tmagic/form';
import type { CodeBlockContent } from '@tmagic/schema';

import FloatingBox from '@editor/components/FloatingBox.vue';
import CodeEditor from '@editor/layouts/CodeEditor.vue';
import type { Services, SlideType } from '@editor/type';
import { getConfig } from '@editor/utils/config';

defineOptions({
  name: 'MEditorCodeBlockEditor',
});

const props = defineProps<{
  content: CodeBlockContent;
  disabled?: boolean;
  isDataSource?: boolean;
  dataSourceType?: string;
  slideType?: SlideType;
}>();

const emit = defineEmits<{
  submit: [values: CodeBlockContent];
}>();

const services = inject<Services>('services');

const difVisible = ref(false);
const height = ref(globalThis.innerHeight);

const windowReizehandler = () => {
  height.value = globalThis.innerHeight;
};

globalThis.addEventListener('resize', windowReizehandler);

onBeforeUnmount(() => {
  globalThis.removeEventListener('resize', windowReizehandler);
});

const magicVsEditor = ref<InstanceType<typeof CodeEditor>>();

const diffChange = () => {
  if (!magicVsEditor.value || !fomDrawer.value?.form) {
    return;
  }

  fomDrawer.value.form.values.content = magicVsEditor.value.getEditorValue();

  difVisible.value = false;
};

const columnWidth = computed(() => services?.uiService.get('columnWidth'));
const size = computed(() =>
  columnWidth.value ? columnWidth.value.center + columnWidth.value.right - (props.isDataSource ? 100 : 0) : 600,
);

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

const functionConfig = computed<FormConfig>(() => [
  {
    text: '名称',
    name: 'name',
    rules: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  },
  {
    text: '描述',
    name: 'desc',
  },
  {
    text: '执行时机',
    name: 'timing',
    type: 'select',
    options: () => {
      const options = [
        { text: '初始化前', value: 'beforeInit' },
        { text: '初始化后', value: 'afterInit' },
      ];
      if (props.dataSourceType !== 'base') {
        options.push({ text: '请求前', value: 'beforeRequest' });
        options.push({ text: '请求后', value: 'afterRequest' });
      }
      return options;
    },
    display: () => props.isDataSource,
  },
  {
    type: 'table',
    border: true,
    text: '参数',
    enableFullscreen: false,
    enableToggleMode: false,
    name: 'params',
    dropSort: false,
    items: [
      {
        type: 'text',
        label: '参数名',
        name: 'name',
      },
      {
        type: 'text',
        label: '描述',
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

const submitForm = (values: CodeBlockContent) => {
  emit('submit', values);
};

const errorHandler = (error: any) => {
  tMagicMessage.error(error.message);
};

const fomDrawer = ref<InstanceType<typeof MFormDrawer>>();

const openHandler = () => {
  setTimeout(() => {
    if (fomDrawer.value) {
      const height = fomDrawer.value?.bodyHeight - 348 - (props.isDataSource ? 50 : 0);
      codeEditorHeight.value = `${height > 100 ? height : 600}px`;
    }
  });
};

const changedValue = ref<CodeBlockContent>();
const changeHandler = (values: CodeBlockContent) => {
  changedValue.value = values;
};

const beforeClose = (done: (cancel?: boolean) => void) => {
  if (!changedValue.value) {
    done();
    return;
  }
  tMagicMessageBox
    .confirm('当前代码块已修改，是否保存？', '提示', {
      confirmButtonText: '保存并关闭',
      cancelButtonText: '不保存并关闭',
      type: 'warning',
      distinguishCancelAndClose: true,
    })
    .then(() => {
      changedValue.value && submitForm(changedValue.value);
      done();
    })
    .catch((action: string) => {
      done(action === 'cancel');
    });
};

const closedHandler = () => {
  changedValue.value = undefined;
};

const boxVisible = ref<boolean>(false);
const editVisible = ref<boolean>(false);
const floatingBoxBody = ref<HTMLDivElement>();

const boxPosition = computed(() => {
  const columnWidth = services?.uiService?.get('columnWidth');
  const navMenuRect = services?.uiService?.get('navMenuRect');
  return {
    left: columnWidth?.left ?? 0,
    top: (navMenuRect?.top ?? 0) + (navMenuRect?.height ?? 0),
  };
});

defineExpose({
  async show() {
    if (props.slideType !== 'box') {
      boxVisible.value = true;
    }
    await nextTick();
    editVisible.value = true;
    fomDrawer.value?.show();
  },

  hide() {
    fomDrawer.value?.hide();
  },
});
</script>
