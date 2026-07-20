<template>
  <div class="m-editor-props-form-panel">
    <slot name="props-form-panel-header"></slot>

    <TMagicScrollbar>
      <MForm
        ref="configForm"
        :class="[propsPanelSize, 'm-editor-props-form-panel-form']"
        :popper-class="`m-editor-props-panel-popper ${propsPanelSize}`"
        :label-width="labelWidth"
        :label-position="labelPosition"
        :size="propsPanelSize"
        :init-values="values"
        :config="config"
        :type-match-valid="true"
        :extend-state="extendState"
        @change="submit"
        @error="errorHandler"
      ></MForm>
    </TMagicScrollbar>

    <TMagicButton
      v-if="!disabledShowSrc"
      class="m-editor-props-panel-src-icon"
      circle
      title="源码"
      :type="showSrc ? 'primary' : ''"
      @click="showSrc = !showSrc"
    >
      <MIcon :icon="DocumentIcon"></MIcon>
    </TMagicButton>

    <CodeEditor
      v-if="showSrc"
      class="m-editor-props-panel-src-code"
      editor-custom-type="m-editor-props-panel-src-code"
      :height="`${editorContentHeight}px`"
      :init-values="codeValueKey ? values[codeValueKey] : values"
      :options="codeOptions"
      :parse="true"
      @save="saveCode"
    ></CodeEditor>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, inject, onMounted, onUnmounted, ref, useTemplateRef, watchEffect } from 'vue';
import { Document as DocumentIcon } from '@element-plus/icons-vue';

import { TMagicButton, tMagicMessage, TMagicScrollbar } from '@tmagic/design';
import type { ContainerChangeEventData, FormConfig, FormState, FormValue } from '@tmagic/form';
import { MForm } from '@tmagic/form';
import { filterXSS } from '@tmagic/utils';

import MIcon from '@editor/components/Icon.vue';
import { ENABLE_PROPS_FORM_VALIDATE } from '@editor/editorProps';
import { useEditorContentHeight } from '@editor/hooks/use-editor-content-height';
import { useServices } from '@editor/hooks/use-services';
import { validatePropsForm } from '@editor/utils/props';

import CodeEditor from '../CodeEditor.vue';

defineSlots<{
  'props-form-panel-header'(_props: {}): any;
}>();

defineOptions({
  name: 'MEditorFormPanel',
});

const props = defineProps<{
  config: FormConfig;
  values: FormValue;
  disabledShowSrc?: boolean;
  labelWidth?: string;
  codeValueKey?: string;
  labelPosition?: string;
  extendState?: (_state: FormState) => Record<string, any> | Promise<Record<string, any>>;
}>();

const emit = defineEmits<{
  submit: [values: any, eventData?: ContainerChangeEventData, error?: any];
  'submit-error': [e: any];
  'form-error': [e: any];
  mounted: [internalInstance: any];
  unmounted: [];
}>();

const enablePropsFormValidate = inject(ENABLE_PROPS_FORM_VALIDATE, false);

const services = useServices();
const { editorService, uiService } = services;

const codeOptions = inject('codeOptions', {});

const showSrc = ref(false);
const propsPanelSize = computed(() => uiService.get('propsPanelSize') || 'small');
const { height: editorContentHeight } = useEditorContentHeight();
const stage = computed(() => editorService.get('stage'));

const configFormRef = useTemplateRef<InstanceType<typeof MForm>>('configForm');

watchEffect(() => {
  if (configFormRef.value) {
    configFormRef.value.formState.stage = stage.value;
    configFormRef.value.formState.services = services;
  }
});

const internalInstance = getCurrentInstance();
onMounted(() => {
  emit('mounted', internalInstance?.proxy);
});

onUnmounted(() => {
  emit('unmounted');
});

const submit = async (v: FormValue, eventData: ContainerChangeEventData) => {
  try {
    const values = await configFormRef.value?.submitForm();
    // 校验成功：正常更新节点（第三个参数 error 为空，表示清除该来源的错误记录）
    emit('submit', values, eventData);
  } catch (e: any) {
    if (enablePropsFormValidate) {
      // 启用校验联动：校验失败时仍以当前表单值更新节点，并把错误信息一并抛给上层记录
      emit('submit', v, eventData, e);
    } else {
      // 未启用：保持原行为，校验失败丢弃本次改动
      emit('submit-error', e);
    }
  }
};

const errorHandler = (e: any) => {
  emit('form-error', e);
};

/**
 * 将校验错误文案安全地转为用于弹窗展示的 HTML。
 *
 * 文案形如 `字段 -> 主文案\n\n建议`，多条以结构性 `<br>` 拼接。为在保留换行排版的同时
 * 避免 `${value}`/字段名中可能夹带的 HTML 造成 XSS：先按结构性 `<br>` 拆分，对每段做 HTML
 * 转义后再把段内换行 `\n` 替换为 `<br>`，最后用 `<br>` 拼回。
 */
const formatValidateErrorHtml = (error: string): string =>
  error
    .split(/<br\s*\/?>/i)
    .map((segment) => filterXSS(segment).replaceAll('\n', '<br>'))
    .join('<br>');

const saveCode = async (values: any) => {
  const newValues = props.codeValueKey ? { [props.codeValueKey]: values } : values;

  if (!enablePropsFormValidate) {
    // 未启用校验联动：保持原行为，直接提交源码保存的值
    emit('submit', newValues);
    return;
  }

  // 启用校验联动：源码编辑器保存的值未经过表单交互，这里另建一个独立的 MForm 实例对最新配置
  // 做一次静默校验（不复用、也不污染页面上正在展示的表单），并将校验结果（错误信息）随提交
  // 一并抛给上层记录，使源码保存的错误状态与表单编辑保持一致。
  try {
    const error = await validatePropsForm({
      config: props.config,
      values: newValues,
      appContext: internalInstance?.appContext ?? null,
      services,
      stage: stage.value,
      typeMatchValid: true,
      extendState: props.extendState,
    });

    if (error) {
      tMagicMessage({
        type: 'error',
        message: formatValidateErrorHtml(error),
        dangerouslyUseHTMLString: true,
      });
    }

    emit('submit', newValues, undefined, error ? new Error(error) : undefined);
  } catch (e: any) {
    console.log('validateForm error', e);
    // 静默校验本身出现异常（如初始化超时）时，退回到不携带错误信息的提交，避免阻塞源码保存
    emit('submit', newValues);
  }
};

defineExpose({ configForm: configFormRef, submit });
</script>
