<template>
  <!-- 代码块编辑区 -->
  <FloatingBox
    v-model:visible="boxVisible"
    v-model:width="width"
    v-model:height="codeBlockEditorHeight"
    :title="content.name ? `${disabled ? '查看' : '编辑'}${content.name}` : '新增代码'"
    :position="boxPosition"
    :before-close="beforeClose"
  >
    <template #body>
      <MFormBox
        class="m-editor-code-block-editor"
        ref="formBox"
        label-width="80px"
        :close-on-press-escape="false"
        :title="content.name"
        :config="functionConfig"
        :values="content"
        :disabled="disabled"
        style="height: 100%"
        @change="changeHandler"
        @submit="submitForm"
        @error="errorHandler"
        @closed="closedHandler"
      >
        <template #left>
          <TMagicButton v-if="!disabled" type="primary" link @click="difVisible = true">查看修改</TMagicButton>
        </template>
      </MFormBox>
    </template>
  </FloatingBox>

  <Teleport to="body">
    <TMagicDialog title="查看修改" v-model="difVisible" fullscreen destroy-on-close>
      <div style="display: flex; margin-bottom: 10px">
        <div style="flex: 1"><TMagicTag size="small" type="danger">修改前</TMagicTag></div>
        <div style="flex: 1"><TMagicTag size="small" type="success">修改后</TMagicTag></div>
      </div>

      <CodeEditor
        ref="magicVsEditor"
        type="diff"
        language="json"
        :disabled-full-screen="true"
        :initValues="content.content"
        :modifiedValues="formBox?.form?.values.content"
        :height="`${windowRect.height - 150}px`"
      ></CodeEditor>

      <template #footer>
        <span class="dialog-footer">
          <TMagicButton size="small" @click="difVisible = false">取消</TMagicButton>
          <TMagicButton size="small" type="primary" @click="diffChange">确定</TMagicButton>
        </span>
      </template>
    </TMagicDialog>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed, inject, nextTick, Ref, ref, useTemplateRef, watch } from 'vue';

import type { CodeBlockContent } from '@tmagic/core';
import { TMagicButton, TMagicDialog, tMagicMessage, tMagicMessageBox, TMagicTag } from '@tmagic/design';
import { type ContainerChangeEventData, type FormConfig, MFormBox } from '@tmagic/form';

import FloatingBox from '@editor/components/FloatingBox.vue';
import { useEditorContentHeight } from '@editor/hooks/use-editor-content-height';
import { useNextFloatBoxPosition } from '@editor/hooks/use-next-float-box-position';
import { useServices } from '@editor/hooks/use-services';
import { useWindowRect } from '@editor/hooks/use-window-rect';
import CodeEditor from '@editor/layouts/CodeEditor.vue';
import { getCodeBlockFormConfig } from '@editor/utils/code-block';
import { getEditorConfig } from '@editor/utils/config';

defineOptions({
  name: 'MEditorCodeBlockEditor',
});

const width = defineModel<number>('width', { default: 670 });
const boxVisible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  content: Omit<CodeBlockContent, 'content'> & { content: string };
  disabled?: boolean;
  isDataSource?: boolean;
  dataSourceType?: string;
}>();

const emit = defineEmits<{
  submit: [values: CodeBlockContent, eventData: ContainerChangeEventData];
  close: [];
  open: [];
}>();

const { codeBlockService, uiService } = useServices();

const { height: codeBlockEditorHeight } = useEditorContentHeight();

const difVisible = ref(false);
const { rect: windowRect } = useWindowRect();

const magicVsEditorRef = useTemplateRef<InstanceType<typeof CodeEditor>>('magicVsEditor');

const diffChange = () => {
  if (!magicVsEditorRef.value || !formBox.value?.form) {
    return;
  }

  formBox.value.form.values.content = magicVsEditorRef.value.getEditorValue();

  difVisible.value = false;
};

const codeOptions = inject<Record<string, any>>('codeOptions', {});

/**
 * 代码块编辑表单配置。统一委托到 utils/code-block 的 `getCodeBlockFormConfig`，
 * 与 CompareForm 等其它使用方共享同一份 schema，避免双份维护。
 *
 * 这里以 computed 包裹是为了让 `props.isDataSource` / `props.dataSourceType` 变化时
 * "执行时机"字段的可见性与可选项实时刷新。
 */
const functionConfig = computed<FormConfig>(() =>
  getCodeBlockFormConfig({
    paramColConfig: codeBlockService.getParamsColConfig(),
    isDataSource: () => Boolean(props.isDataSource),
    dataSourceType: () => props.dataSourceType,
    codeOptions,
    editable: true,
  }),
);

const parseContent = (content: any) => {
  if (typeof content === 'string') {
    // 如果是字符串则转换为函数
    const parseDSL = getEditorConfig('parseDSL');
    return parseDSL<(..._args: any[]) => any>(content);
  }
  return content;
};

const submitForm = (values: CodeBlockContent, data: ContainerChangeEventData) => {
  changedValue.value = undefined;

  emit(
    'submit',
    {
      ...values,
      content: parseContent(values.content),
    },
    {
      ...data,
      changeRecords: data.changeRecords?.map((record) => {
        let { value } = record;
        if (record.propPath === 'content' && typeof value === 'string') {
          value = parseContent(value);
        }
        return {
          ...record,
          value,
        };
      }),
    },
  );
};

const errorHandler = (error: any) => {
  tMagicMessage.error(error.message);
};

const formBox = useTemplateRef<InstanceType<typeof MFormBox>>('formBox');

const changedValue = ref<CodeBlockContent>();
const changeHandler = (values: CodeBlockContent) => {
  changedValue.value = values;
};

const beforeClose = (done: (_cancel?: boolean) => void) => {
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
      changedValue.value && submitForm(changedValue.value, { changeRecords: formBox.value?.form?.changeRecords });
      done();
    })
    .catch((action: string) => {
      if (action === 'cancel') {
      }
      done(action === 'cancel');
    });
};

const closedHandler = () => {
  changedValue.value = undefined;
};

const parentFloating = inject<Ref<HTMLDivElement | null>>('parentFloating', ref(null));
const { boxPosition, calcBoxPosition } = useNextFloatBoxPosition(uiService, parentFloating);

watch(boxVisible, (visible) => {
  nextTick(() => {
    if (!visible) {
      emit('close');
    } else {
      emit('open');
    }
  });
});

defineExpose({
  async show() {
    calcBoxPosition();
    boxVisible.value = true;
  },

  async hide() {
    boxVisible.value = false;
  },
});
</script>
