<template>
  <TMagicDialog
    v-model="visible"
    class="m-editor-history-diff-dialog"
    :title="dialogTitle"
    top="5vh"
    destroy-on-close
    append-to-body
    :width="width"
    @close="onClose"
  >
    <div v-if="payload && visible" class="m-editor-history-diff-dialog-body">
      <div v-if="onConfirm" class="m-editor-history-diff-dialog-notice">仅回滚有差异的字段</div>

      <div class="m-editor-history-diff-dialog-header">
        <span class="m-editor-history-diff-dialog-target">{{ targetText }}</span>
        <div class="m-editor-history-diff-dialog-controls">
          <TMagicRadioGroup v-model="viewMode" size="small" class="m-editor-history-diff-dialog-view">
            <TMagicRadioButton value="form">表单对比</TMagicRadioButton>
            <TMagicRadioButton value="code">源码对比</TMagicRadioButton>
          </TMagicRadioGroup>

          <TMagicRadioGroup v-model="mode" size="small" class="m-editor-history-diff-dialog-mode">
            <TMagicRadioButton value="before">与修改前对比</TMagicRadioButton>
            <TMagicRadioButton value="current" :disabled="!hasCurrent">与当前对比</TMagicRadioButton>
          </TMagicRadioGroup>
        </div>
      </div>

      <div class="m-editor-history-diff-dialog-legend">
        <TMagicTag size="small" type="danger">{{ leftLabel }}</TMagicTag>
        <span class="m-editor-history-diff-dialog-arrow">→</span>
        <TMagicTag size="small" type="success">{{ rightLabel }}</TMagicTag>
        <span v-if="mode === 'current' && isSameAsCurrent" class="m-editor-history-diff-dialog-tip">
          当前值与该步修改后一致，无差异
        </span>
      </div>

      <CompareForm
        v-if="viewMode === 'form'"
        :category="payload.category"
        :type="payload.type"
        :data-source-type="payload.dataSourceType"
        :value="rightValue"
        :last-value="leftValue"
        :base-form-state="compareFormState"
        :extend-state="extendState"
        :load-config="loadConfig"
        :self-diff-field-types="selfDiffFieldTypes"
        :services="props.services"
        height="70vh"
      />

      <CodeEditor
        v-else
        type="diff"
        language="json"
        :init-values="leftValue"
        :modified-values="rightValue"
        :options="codeDiffOptions"
        disabled-full-screen
        height="70vh"
      />
    </div>

    <template #footer>
      <template v-if="isConfirm">
        <TMagicButton size="small" @click="visible = false">取消</TMagicButton>
        <TMagicButton size="small" type="primary" @click="onConfirmClick">确定回滚</TMagicButton>
      </template>
      <TMagicButton v-else size="small" @click="visible = false">关闭</TMagicButton>
    </template>
  </TMagicDialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { isEqual } from 'lodash-es';

import { TMagicButton, TMagicDialog, TMagicRadioButton, TMagicRadioGroup, TMagicTag } from '@tmagic/design';
import type { FormState } from '@tmagic/form';

import CompareForm from '@editor/components/CompareForm.vue';
import { useServices } from '@editor/hooks/use-services';
import CodeEditor from '@editor/layouts/CodeEditor.vue';
import type { CompareCategory, CompareFormLoadConfig, DiffDialogPayload, Services } from '@editor/type';

defineOptions({
  name: 'MEditorHistoryDiffDialog',
});

const props = withDefaults(
  defineProps<{
    /** 编辑器服务集合，由调用方传入（不再通过 inject('services') 获取）。 */
    services: Services;
    /**
     * 来自 Editor 顶层的 `extendFormState`，用于扩展 MForm.formState。
     * 透传给 CompareForm，从而让差异对比时表单 item 中依赖业务上下文的
     * `display` / `disabled` 等 filterFunction 正常工作。
     */
    extendState?: (_state: FormState) => Record<string, any> | Promise<Record<string, any>>;
    /**
     * 自定义 FormConfig 加载逻辑，透传给 CompareForm。传入后将接管内置的按 `category`
     * 取配置逻辑，可通过 `ctx.defaultLoadConfig()` 复用默认结果再做二次加工。
     */
    loadConfig?: CompareFormLoadConfig;
    width?: string;
    isConfirm?: boolean;
    onConfirm?: () => void;
    selfDiffFieldTypes?: string[];
    compareFormState?: FormState;
  }>(),
  {
    services: () => useServices(),
    width: '900px',
  },
);

const emit = defineEmits(['close']);

/**
 * 差异对比模式：
 * - before：该步骤修改前 vs 该步骤修改后（默认行为，体现这一步带来的变化）
 * - current：该步骤修改后 vs 当前最新值（用于查看「该步骤之后是否还被改过」）
 */
type DiffMode = 'before' | 'current';

/**
 * 展示形态：
 * - form：以属性表单形式逐字段对比（默认，可读性更好）
 * - code：以 JSON 源码形式做整体 diff（贴近"看原始数据差异"，可看到表单未覆盖的字段）
 */
type ViewMode = 'form' | 'code';

const visible = ref(false);
const payload = ref<DiffDialogPayload | null>(null);
const mode = ref<DiffMode>('before');
const viewMode = ref<ViewMode>('form');

/**
 * 源码对比始终只读，关闭小地图，强制左右并排（side-by-side）展示。
 *
 * monaco diff 编辑器在宽度低于 `renderSideBySideInlineBreakpoint`（默认 900px）时
 * 会自动退化为 inline（上下/单栏）视图。本弹窗宽度约 900px，去掉内边距后编辑器实际
 * 宽度小于该阈值，会被切到 inline。这里通过 `useInlineViewWhenSpaceIsLimited: false`
 * 关闭该自动降级，确保始终保持左右两栏对比。
 */
const codeDiffOptions = {
  readOnly: true,
  tabSize: 2,
  minimap: { enabled: false },
  renderSideBySide: true,
  useInlineViewWhenSpaceIsLimited: false,
  scrollBeyondLastLine: false,
  hideUnchangedRegions: {
    enabled: true,
  },
};

const dialogTitle = computed(() => (props.onConfirm ? '确认回滚' : '查看修改差异'));

const hasCurrent = computed(() => payload.value?.currentValue !== undefined && payload.value?.currentValue !== null);

/** 左侧（旧/参照）值 */
const leftValue = computed<Record<string, any>>(() => {
  if (!payload.value) return {};
  if (mode.value === 'current') return payload.value.value;
  return payload.value.lastValue;
});

/** 右侧（新/对比）值 */
const rightValue = computed<Record<string, any>>(() => {
  if (!payload.value) return {};
  if (mode.value === 'current') return payload.value.currentValue || {};
  return payload.value.value;
});

const leftLabel = computed(() => (mode.value === 'current' ? '该步修改后' : '修改前'));
const rightLabel = computed(() => (mode.value === 'current' ? '当前' : '修改后'));

/** 「与当前对比」模式下，若当前值与该步修改后值相等，则展示提示 */
const isSameAsCurrent = computed(() => {
  if (mode.value !== 'current' || !payload.value) return false;
  return isEqual(payload.value.value, payload.value.currentValue);
});

/** confirm() 的 resolve，仅在「等待用户确认回滚」期间存在 */
let confirmResolve: ((_value: boolean) => void) | null = null;

const onConfirmClick = () => {
  props.onConfirm?.();

  // 用户确认回滚：resolve(true)，并清空以避免随后 visible=false 再 resolve(false)
  confirmResolve?.(true);
  confirmResolve = null;

  visible.value = false;
};

const targetText = computed(() => {
  if (!payload.value) return '';
  const categoryText: Record<CompareCategory, string> = {
    node: '节点',
    'data-source': '数据源',
    'code-block': '代码块',
  };
  const { category } = payload.value;
  const prefix = category ? categoryText[category] : '';
  const label = payload.value.targetLabel || payload.value.type || '';
  const { id } = payload.value;
  const labelWithId = id !== undefined && id !== '' ? `${label}（${id}）` : label;
  return [prefix, labelWithId].filter(Boolean).join('：');
});

const open = (p: DiffDialogPayload) => {
  payload.value = p;
  // 每次打开按需重置默认模式：有当前值时优先「与当前对比」更贴近"看现在差什么"，否则回退到默认
  mode.value = 'before';
  // 默认回到表单对比形态，避免残留上一次选择的源码模式
  viewMode.value = 'form';
  visible.value = true;
};

/**
 * 以 Promise 形式打开确认回滚弹窗：
 * - 用户点击「确定回滚」时 resolve(true)；
 * - 取消 / 关闭 / 按 Esc 等其他方式关闭弹窗时 resolve(false)。
 *
 * 同一时刻只允许一个待确认流程，重复调用会先 resolve(false) 掉上一个。
 */
const confirm = (p: DiffDialogPayload): Promise<boolean> => {
  // 终止上一个未完成的确认流程，避免悬挂的 Promise
  confirmResolve?.(false);
  confirmResolve = null;

  return new Promise<boolean>((resolve) => {
    confirmResolve = resolve;
    open(p);
  });
};

const close = () => {
  visible.value = false;
};

// 关闭后清理 payload，避免下一次打开时残留旧值闪现
watch(visible, (v) => {
  if (!v) {
    payload.value = null;
    // 非「确定回滚」方式关闭（取消 / Esc / 点遮罩等）时，resolve(false)
    confirmResolve?.(false);
    confirmResolve = null;
  }
});

const onClose = () => {
  emit('close');
};

defineExpose({
  open,
  confirm,
  close,
});
</script>
