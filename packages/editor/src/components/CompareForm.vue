<template>
  <div class="m-editor-compare-form-wrapper" :style="wrapperStyle">
    <MForm
      v-if="config.length"
      ref="form"
      class="m-editor-compare-form"
      :config="config"
      :init-values="currentValues"
      :last-values="lastValuesProcessed"
      :is-compare="true"
      :disabled="true"
      :label-width="labelWidth"
      :extend-state="mergedExtendState"
      :show-diff="showDiff"
      :self-diff-field-types="selfDiffFieldTypes"
      :size="size"
    ></MForm>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, provide, type Ref, ref, type ShallowRef, useTemplateRef, watch, watchEffect } from 'vue';
import { isEqual } from 'lodash-es';

import { type CodeBlockContent, type DataSourceSchema, HookType, type MNode } from '@tmagic/core';
import { type FieldSize } from '@tmagic/design';
import { type FormConfig, type FormState, type FormValue, MForm } from '@tmagic/form';

import type { CompareCategory, CompareFormLoadConfig, Services } from '@editor/type';
import { getCodeBlockFormConfig } from '@editor/utils/code-block';

defineOptions({
  name: 'MEditorCompareForm',
});

const props = withDefaults(
  defineProps<{
    /** 当前值（修改后的值） */
    value: Partial<MNode> | Partial<DataSourceSchema> | Partial<CodeBlockContent> | Record<string, any>;
    /** 用于对比的旧值（修改前的值） */
    lastValue?: Partial<MNode> | Partial<DataSourceSchema> | Partial<CodeBlockContent> | Record<string, any>;
    /**
     * 类型说明：
     * - `category` 为 `node` 时，`type` 为节点组件的类型，例如 'text'、'button'、'page'、'container' 等
     * - `category` 为 `data-source` 时，`type` 为数据源类型，例如 'base'、'http'
     * - `category` 为 `code-block` 时，`type` 可不传
     */
    type?: string;
    /** 表单配置类别，决定从哪里取 FormConfig */
    category?: CompareCategory;
    /** 数据源代码块场景下的数据源类型（base/http），用于代码块表单中"执行时机"展示 */
    dataSourceType?: string;
    labelWidth?: string;
    /**
     * 外层容器高度。设置后表单内容超出时会在 CompareForm 内部出现滚动条，
     * 避免 dialog / 面板使用方需要自行处理滚动。可传任意 CSS 长度，例如 `60vh` / `400px` / `100%`。
     */
    height?: string;
    /**
     * 用户自定义注入到 MForm.formState 的扩展字段，与 Editor 顶层的 `extendFormState`、
     * PropsPanel 的 `extend-state` 语义一致。表单 item 的 `display` / `disabled` 等
     * filterFunction 经常依赖这里注入的字段（如 stage、自定义业务上下文等），
     * 因此在差异对比场景下也需要透传，避免出现 `formState.xxx is undefined` 的运行时错误。
     */
    extendState?: (_state: FormState) => Record<string, any> | Promise<Record<string, any>>;
    /**
     * 外部透传的基础 formState（通常来自 PropsPanel 主属性表单）。
     * CompareForm 会提取其中的扩展字段覆盖到自己的 formState，保证 filterFunction 上下文一致。
     */
    baseFormState?: FormState;
    /** 需要走 self diff 的字段类型（例如 mod-cond）。 */
    selfDiffFieldTypes?: string[];
    /**
     * 表单内组件的尺寸（透传给 MForm 的 `size`），可选 'large' | 'default' | 'small'。
     * 缺省时使用 MForm 内置默认尺寸。
     */
    size?: FieldSize;
    /**
     * 自定义 FormConfig 加载逻辑。传入后将接管内置的按 `category`(node/data-source/code-block)
     * 取配置逻辑，调用方可根据业务自行返回（或异步返回）表单配置。可通过
     * `ctx.defaultLoadConfig()` 复用默认结果再做二次加工。返回的 config 直接用于对比展示。
     */
    loadConfig?: CompareFormLoadConfig;
    /** 编辑器服务集合，由调用方传入（不再通过 inject('services') 获取）。 */
    services?: Services;
  }>(),
  {
    category: 'node',
    labelWidth: '120px',
    extendState: (state: FormState) => state,
  },
);

provide('services', props.services);

const config = ref<FormConfig>([]);

/** vs-code 编辑器的 monaco 配置项，沿用 Editor 顶层 provide('codeOptions', ...) 的注入。 */
const codeOptions = inject<Record<string, any>>('codeOptions', {});

/** 将代码块的 content 字段统一成字符串，便于在表单/对比中展示 */
const normalizeCodeBlockValue = (
  v: Partial<CodeBlockContent> | Record<string, any> | undefined,
): Record<string, any> => {
  if (!v) return {};
  const next: Record<string, any> = { ...v };
  if (next.content && typeof next.content !== 'string') {
    try {
      next.content = next.content.toString();
    } catch {
      next.content = '';
    }
  }
  return next;
};

const currentValues = computed<FormValue>(() => {
  if (props.category === 'code-block') {
    return normalizeCodeBlockValue(props.value as Partial<CodeBlockContent>);
  }
  return (props.value || {}) as FormValue;
});

const lastValuesProcessed = computed<FormValue>(() => {
  if (props.category === 'code-block') {
    return normalizeCodeBlockValue(props.lastValue as Partial<CodeBlockContent>);
  }
  return (props.lastValue || {}) as FormValue;
});

/**
 * 外层包裹层的样式：当传入 `height` 时启用固定高度 + 内部滚动，
 * 这样滚动条会出现在 CompareForm 内部，避免父容器（如 Dialog）自身也产生滚动。
 */
const wrapperStyle = computed(() => {
  if (!props.height) return undefined;
  return {
    height: props.height,
    overflow: 'auto',
  } as Record<string, string>;
});

/**
 * `code-select` 字段在历史数据中存在两种"语义为空"的形态：
 * - 字符串 `''`（旧数据 / 用户从未配置过钩子）；
 * - `{ hookType: HookType.CODE, hookData: [] }`（CodeSelect.vue 在挂载时
 *   写入的默认结构，参见 packages/editor/src/fields/CodeSelect.vue 中
 *   `props.model[props.name] = { hookType: HookType.CODE, hookData: [] }`）。
 *
 * 直接 `isEqual` 会把两者判为不等，从而在历史对比里对每个未配置过钩子的组件
 * 都展示一份"差异"，体验很糟糕。这里把它们视为相等，跳过对比。
 *
 * 其它类型字段沿用 MForm/Container 的默认 `!isEqual` 判断逻辑。
 */
const isEmptyCodeSelectValue = (v: any): boolean => {
  if (v === '' || v === undefined || v === null) return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return typeof v === 'object' && v.hookType === HookType.CODE && Array.isArray(v.hookData) && v.hookData.length === 0;
};

const showDiff = ({ curValue, lastValue, config }: { curValue: any; lastValue: any; config: any }) => {
  if (config?.type === 'code-select') {
    // 双方都是"空形态"，视为相等，不展示对比
    if (isEmptyCodeSelectValue(curValue) && isEmptyCodeSelectValue(lastValue)) {
      return false;
    }
  }
  return !isEqual(curValue, lastValue);
};

const removeStyleDisplayConfig = (formConfig: FormConfig): FormConfig =>
  formConfig.map((item) => {
    if (!('type' in item)) return item;
    if (item?.type !== 'tab' || !Array.isArray(item.items)) return item;

    return {
      ...item,
      items: item.items.map((tabPane) => {
        if (tabPane?.title !== '样式' || !Array.isArray(tabPane.items)) return tabPane;

        return {
          ...tabPane,
          display: true,
        };
      }),
    };
  });

const mergedExtendState = (state: FormState) => {
  return props.extendState(props.baseFormState || state);
};

/**
 * 内置的默认 FormConfig 加载逻辑：按 `category` 从对应 service / 工具取配置。
 * 作为 ctx.defaultLoadConfig 透传给自定义 `loadConfig`，方便复用与二次加工。
 */
const defaultLoadConfig = async (): Promise<FormConfig> => {
  if (!props.services) {
    return [];
  }

  switch (props.category) {
    case 'node': {
      if (!props.type) {
        return [];
      }
      return removeStyleDisplayConfig(
        await props.services.propsService.getPropsConfig(props.type, { node: props.value as unknown as MNode }),
      );
    }
    case 'data-source': {
      const config = props.services.dataSourceService.getFormConfig(props.type || 'base');
      // 数据源表单外层 tab 的「数据定义」项 status 为 'fields'，tab-pane name 随之为 'fields'。
      // 未显式设置 active 时，Tabs 默认取 '0'，与 'fields' 不匹配会导致打开弹窗时无默认激活项，
      // 这里与 DataSourceConfigPanel 保持一致，默认激活「数据定义」tab。
      return config.map((item) => ('type' in item && item.type === 'tab' ? { ...item, active: 'fields' } : item));
    }
    case 'code-block': {
      return getCodeBlockFormConfig({
        paramColConfig: props.services.codeBlockService.getParamsColConfig(),
        // 通过传入 dataSourceType 间接表达"是数据源代码块"——在对比场景下 props.dataSourceType
        // 由调用方按 step 上下文显式传入，未传则视为普通代码块，「执行时机」字段隐藏。
        isDataSource: () => Boolean(props.dataSourceType),
        dataSourceType: () => props.dataSourceType,
        codeOptions,
        // 对比模式只读，不需要校验/语法检查
        editable: false,
      });
    }
    default:
      return [];
  }
};

const loadConfig = async () => {
  if (props.loadConfig) {
    config.value = await props.loadConfig({
      category: props.category,
      type: props.type,
      dataSourceType: props.dataSourceType,
      defaultLoadConfig,
    });
    return;
  }

  config.value = await defaultLoadConfig();
};

watch(
  [() => props.category, () => props.type, () => props.dataSourceType, () => props.loadConfig],
  () => {
    loadConfig();
  },
  { immediate: true },
);

const formRef = useTemplateRef<InstanceType<typeof MForm>>('form');

/**
 * 把 services / stage 注入 MForm 的 formState，避免 propsService 注入的表单配置中
 * 形如 `display: ({ services }) => services.uiService.get(...)` 的 filterFunction
 * 在执行时拿不到 `formState.services` 而报错。
 *
 * 与 props-panel/FormPanel.vue 中的注入方式保持一致：
 * - services：整个 useServices() 返回的服务集合；
 * - stage：当前 editorService.get('stage') 的最新值。
 */
watchEffect(() => {
  if (formRef.value && props.services) {
    formRef.value.formState.stage = props.services.editorService.get('stage');
    formRef.value.formState.services = props.services;
  }
});

defineExpose<{
  form: ShallowRef<InstanceType<typeof MForm> | null>;
  config: Ref<FormConfig>;
  reload: () => Promise<void>;
}>({
  form: formRef,
  config,
  reload: loadConfig,
});
</script>
