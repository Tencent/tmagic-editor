<template>
  <TMagicForm
    :class="[
      'm-form',
      effectiveTheme ? `m-form--${effectiveTheme}` : '',
      effectiveTheme ? `m-theme--${effectiveTheme}` : '',
    ]"
    ref="tMagicForm"
    :model="values"
    :label-width="labelWidth"
    :style="`height: ${height}`"
    :inline="inline"
    :label-position="labelPosition"
    @submit="submitHandler"
  >
    <template v-if="initialized && Array.isArray(config)">
      <Container
        v-for="(item, index) in config"
        :disabled="disabled"
        :key="(item as Record<string, any>)[keyProp] ?? index"
        :config="item"
        :model="values"
        :last-values="lastValuesProcessed"
        :is-compare="isCompare"
        :label-width="item.labelWidth || labelWidth"
        :label-position="item.labelPosition || labelPosition"
        :step-active="stepActive"
        :size="size"
        @change="changeHandler"
      >
        <template v-if="$slots.label" #label="labelProps">
          <slot name="label" v-bind="labelProps"></slot>
        </template>
      </Container>
    </template>
  </TMagicForm>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, provide, reactive, ref, shallowRef, toRaw, useTemplateRef, watch } from 'vue';
import { cloneDeep, isEqualWith } from 'lodash-es';

import { M_THEME_KEY, TMagicForm, tMagicMessage, tMagicMessageBox } from '@tmagic/design';
import { setValueByKeyPath } from '@tmagic/utils';

import Container from './containers/Container.vue';
import { applyMountValueEffects } from './utils/collectFields';
import { createFormStateBase, createFormStateProxy, initValue, mergeFormContexts } from './utils/form';
import { formatValidateError as formatError, getTextByName as findTextByName } from './utils/validateError';
import type {
  ChangeRecord,
  ContainerChangeEventData,
  FormConfig,
  FormContext,
  FormSlots,
  FormState,
  FormValue,
} from './schema';
import { FORM_CONTEXT_KEY, FORM_DIFF_CONFIG_KEY, FORM_TYPE_MATCH_VALID_KEY } from './schema';

defineOptions({
  name: 'MForm',
});

defineSlots<FormSlots>();

const props = withDefaults(
  defineProps<{
    /** 表单配置 */
    config: FormConfig;
    /** 表单值 */
    initValues: Record<string, any>;
    /** 需对比的值（开启对比模式时传入） */
    lastValues?: Record<string, any>;
    /** 是否开启对比模式 */
    isCompare?: boolean;
    parentValues?: Record<string, any>;
    labelWidth?: string;
    /** 是否开启类型匹配校验 */
    typeMatchValid?: boolean;
    /**
     * 初始化（`config` / `initValues` 就绪）后是否立即执行一次表单校验。
     *
     * - `false`（默认）：不自动校验，避免打开表单时就展示错误态；
     * - `true`：初始化完成后在 `nextTick` 中调用 `validate()`。
     */
    validateOnInit?: boolean;
    disabled?: boolean;
    height?: string;
    stepActive?: string | number;
    size?: 'small' | 'default' | 'large';
    inline?: boolean;
    labelPosition?: 'top' | 'left' | 'right';
    keyProp?: string;
    popperClass?: string;
    preventSubmitDefault?: boolean;
    /**
     * 表单校验失败时，错误提示前缀是否使用字段的 text 文案（通过 `getTextByName` 从 config 中查找）。
     *
     * - `true`（默认）：错误提示形如 `字段文案 -> 错误信息`，找不到 text 时回退为字段 name；
     * - `false`：跳过查找，直接使用字段 name 作为错误提示前缀（形如 `字段name -> 错误信息`）。
     */
    useFieldTextInError?: boolean;
    /**
     * 宿主业务上下文。也可由祖先 `provide(FORM_CONTEXT_KEY)` 下发，本 prop 覆盖祖先的同名字段。
     *
     * 配置回调通过 `mForm.xxx` 读取，由 formState 的读穿 Proxy 落到这里。
     */
    context?: FormContext;
    /**
     * 自定义"是否展示对比内容"的判断函数（仅在 `isCompare === true` 时生效）。
     *
     * - 不传：使用默认逻辑 `!isEqual(curValue, lastValue)`；
     * - 传函数：完全以函数返回值为准，返回 `true` 才展示前后两份对比内容。
     *
     * 通过 provide 下发给所有层级的 Container（含嵌套在容器组件内部的 Container），
     * 调用方只需在 MForm 这一层传一次即可对整棵表单生效。
     *
     * 典型场景：某些字段语义上相等但结构不同（例如 `code-select` 字段中 `''` 与
     * `{ hookType: 'code', hookData: [] }` 应视为相等），调用方在此处显式声明，
     * 避免被 lodash `isEqual` 误判为差异。
     */
    showDiff?: (_data: { curValue: any; lastValue: any; config: any }) => boolean;
    /**
     * 自定义「自接管对比」的字段类型（仅在对比模式下生效）。
     *
     * 自接管对比的字段不会渲染前后两份独立组件，而是只渲染一次并由字段组件内部展示前后差异
     * （如 vs-code 使用 monaco diff 编辑器；event-select / code-select-col 等复合字段逐项展示差异）。
     *
     * 支持两种形式：
     * - 传数组：在内置类型基础上「追加」这些类型；
     * - 传函数：入参为内置类型数组，返回值作为「最终」完整列表（可完全替换内置项）。
     *
     * 通过 provide 下发，对整棵表单的所有层级 Container 生效，只需在 MForm 这一层传一次。
     */
    selfDiffFieldTypes?: string[] | ((_defaultTypes: string[]) => string[]);
    /**
     * 主题名称：对应 `packages/form/src/theme/themes/<theme>/index.scss` 的目录名。
     *
     * 设置后会在表单根元素上追加 `m-form--<theme>` 修饰类，配合按需引入
     * `@tmagic/form/dist/themes/<theme>.css` 即可启用主题样式。
     *
     * 例如：`<MForm theme="magic-admin" />` + `import '@tmagic/form/dist/themes/magic-admin.css'`。
     */
    theme?: string;
  }>(),
  {
    config: () => [],
    initValues: () => ({}),
    lastValues: () => ({}),
    isCompare: false,
    parentValues: () => ({}),
    labelWidth: '200px',
    disabled: false,
    height: 'auto',
    stepActive: 1,
    inline: false,
    labelPosition: 'right',
    keyProp: '__key',
    useFieldTextInError: true,
    validateOnInit: false,
  },
);

const emit = defineEmits(['change', 'error', 'field-input', 'field-change', 'update:stepActive']);

provide(
  FORM_TYPE_MATCH_VALID_KEY,
  computed(() => props.typeMatchValid),
);

const tMagicFormRef = useTemplateRef('tMagicForm');
const initialized = ref(false);
const values = ref<FormValue>({});
const lastValuesProcessed = ref<FormValue>({});

/**
 * 当前表单生效的主题名称：
 * - 优先用本组件自己的 `props.theme`；
 * - 没设置时回退到最近祖先 `<MEditor>` / `<MForm>` provide 的主题，便于内嵌于编辑器
 *   时自动跟随外层主题，无需在每个 `MForm` 上重复传 `theme`。
 *
 * 同时把合并后的值再 provide 出去（见下方 `provide(M_THEME_KEY, ...)`），让 form 子树
 * 里再嵌套的 portal 组件（`TMagicPopover` 等）依然能拿到非空主题。
 */
const ancestorTheme = inject(M_THEME_KEY, null);
const effectiveTheme = computed(() => props.theme || ancestorTheme?.value || '');

/**
 * 拼到 `formState.popperClass` 上的主题修饰类（仅 `m-theme--<theme>`，
 * 不带 `m-form` / `m-editor` 前缀，因为 Element Plus 弹层节点本身既不是 form 也不是 editor）。
 *
 * 这条类会随所有读 `mForm.popperClass` 的字段（Select / DateTime / Cascader 等）下发到
 * Element Plus 的 `popper-class`，让 portal 节点也命中 `m-theme--<theme>` 上的 CSS 变量。
 */
const themeClass = computed(() => (effectiveTheme.value ? `m-theme--${effectiveTheme.value}` : ''));

/**
 * formState 实现说明：
 *
 * 1. 与 props 直接对应的字段（config / initValues / lastValues / isCompare / parentValues /
 *    keyProp / popperClass）使用「访问器（getter）」定义，每次读取都会回到 `props.xxx`
 *    取最新值，不存在「props 变了但 formState 还没同步过来」的中间态。
 *
 * 2. `values` / `lastValuesProcessed` 是 ref，Vue 的 `reactive` 会自动解包，因此每次
 *    访问 `formState.values` / `formState.lastValuesProcessed` 也都是当前 ref 值。
 *
 * 3. 宿主业务上下文不再 merge 进 coreState，而是单独放在 `contextRef` 上，由读穿
 *    Proxy 在 miss 时落到 context。核心字段结构性优先，`mForm.xxx` 永久兼容旧读法。
 *
 * 4. `popperClass` 会自动拼接 `themeClass`：调用方传入的 `popperClass` + 当前主题
 *    修饰类（含祖先 `<MEditor>` provide 的主题）。这样所有透传到 Element Plus 弹层
 *    `popper-class` 的字段（Select / DateTime / Cascader 等）能自带主题作用域。
 */
const coreState: FormState = reactive<FormState>({
  get keyProp() {
    return props.keyProp;
  },
  get popperClass() {
    const userClass = props.popperClass ?? '';
    const tc = themeClass.value;
    if (!userClass) return tc;
    if (!tc) return userClass;
    return `${userClass} ${tc}`;
  },
  get config() {
    return props.config;
  },
  get initValues() {
    return props.initValues;
  },
  get isCompare() {
    return props.isCompare;
  },
  get lastValues() {
    return props.lastValues;
  },
  get parentValues() {
    return props.parentValues;
  },
  values,
  lastValuesProcessed,
  $emit: emit as (_event: string, ..._args: any[]) => void,
  ...createFormStateBase({ $message: tMagicMessage, $messageBox: tMagicMessageBox }),
});

const ancestorContext = inject(FORM_CONTEXT_KEY, undefined);

/**
 * 宿主业务上下文：`props.context` 覆盖祖先注入的同名字段。
 * 嵌套表单（Link / FormBox / FormDialog）通过下面的 provide 自动继承。
 */
const contextRef = computed<FormContext>(() => mergeFormContexts(ancestorContext?.value, props.context));

const formState: FormState = createFormStateProxy(coreState, () => contextRef.value);

provide('mForm', formState);
provide(FORM_CONTEXT_KEY, contextRef);

/**
 * 把生效主题（自身或祖先）再 provide 出去，供 form 子树内含 `Teleport` 的组件
 * （如 `TMagicPopover`）在传送目标上挂 `m-theme--<theme>` 类。
 * 详见 `@tmagic/design/theme.ts`。
 */
provide(M_THEME_KEY, effectiveTheme);
provide('formInline', props.inline);
// 对比相关配置单独通过 provide 下发，所有层级的 Container 通过 inject 获取，无需逐层透传 prop。
// 用 getter 对象保证读取时回到最新的 props 值，维持响应式。
provide(FORM_DIFF_CONFIG_KEY, {
  get showDiff() {
    return props.showDiff;
  },
  get selfDiffFieldTypes() {
    return props.selfDiffFieldTypes;
  },
});

const changeRecords = shallowRef<ChangeRecord[]>([]);

/**
 * 两份配置的结构是否一致；函数一律视为相等。
 *
 * 宿主（如编辑器属性面板）往往在每次节点更新后整份重新生成配置，其中的
 * `display` / `options` / `onChange` 都是新闭包，深比较必然判不等。若据此把 `initialized`
 * 置 false，整棵表单会卸载重挂，滚动位置、展开态、输入焦点全部丢失。
 * 配置是响应式 prop，闭包换了照样生效，只有结构变化（增删字段、换组件类型）才需要重挂。
 */
const isSameConfigShape = (config: unknown, preConfig: unknown) =>
  isEqualWith(config, preConfig, (a, b) => (typeof a === 'function' && typeof b === 'function' ? true : undefined));

watch(
  [() => props.config, () => props.initValues],
  async ([config], [preConfig]) => {
    changeRecords.value = [];

    if (!isSameConfigShape(toRaw(config), toRaw(preConfig))) {
      initialized.value = false;
    }

    initValue(formState, {
      initValues: props.initValues,
      config: props.config,
    }).then((value) => {
      values.value = value;
      // 字段的值初始化写入统一在这里执行，字段组件自身不再改写 model。
      // 必须放在赋值之后：effect 与动态 type / display 回调读到的 formValue 才是这一轮的值。
      applyMountValueEffects(formState, props.config, values.value);
      // 非对比模式，初始化完成
      initialized.value = !props.isCompare;

      if (props.validateOnInit) {
        nextTick(() => {
          tMagicFormRef.value?.validate();
        });
      }
    });

    if (props.isCompare) {
      // 对比模式下初始化待对比的表单值
      initValue(formState, {
        initValues: props.lastValues,
        config: props.config,
      }).then((value) => {
        lastValuesProcessed.value = value;
        // 对比模式下待对比的那份值同样要规整，否则会与当前值比出「格式差异」这种假差异
        applyMountValueEffects(formState, props.config, lastValuesProcessed.value);
        initialized.value = true;
      });
    }
  },
  { immediate: true },
);

const changeHandler = (v: FormValue, eventData: ContainerChangeEventData) => {
  if (eventData.changeRecords?.length) {
    for (const record of eventData.changeRecords) {
      if (record.propPath) {
        const index = changeRecords.value.findIndex((item) => item.propPath === record.propPath);
        if (index > -1) {
          changeRecords.value[index] = record;
        } else {
          changeRecords.value.push(record);
        }

        setValueByKeyPath(record.propPath, record.value, values.value);
      }
    }
  }
  emit('change', values.value, eventData);
};

const submitHandler = (e: SubmitEvent) => {
  if (props.preventSubmitDefault) {
    e.preventDefault();
  }
};

const getTextByName = (name: string, config: FormConfig = props.config): string | undefined =>
  findTextByName(name, config);

/**
 * 将校验返回的 invalidFields 汇总为可读的错误文案（多条以 `<br>` 拼接）。
 *
 * 实现收口在 `utils/validateError`，供渲染式校验（本组件的 `submitForm` / `validate`）与
 * 无渲染校验（`validateValues`）共用，保证两条链路产出的错误文案格式完全一致。
 */
const formatValidateError = (invalidFields: Record<string, any>): string =>
  formatError(invalidFields, { config: props.config, useFieldTextInError: props.useFieldTextInError });

defineExpose({
  values,
  lastValuesProcessed,
  formState,
  initialized,
  changeRecords,

  changeHandler,

  resetForm: () => {
    tMagicFormRef.value?.resetFields();
    changeRecords.value = [];
  },

  submitForm: async (native?: boolean): Promise<any> => {
    try {
      const result = await tMagicFormRef.value?.validate();
      // tdesign 错误通过返回值返回
      // element-plus 通过throw error
      if (result !== true) {
        throw result;
      }
      changeRecords.value = [];
      return native ? values.value : cloneDeep(toRaw(values.value));
    } catch (invalidFields: any) {
      emit('error', invalidFields);

      throw new Error(formatValidateError(invalidFields));
    }
  },

  /**
   * 校验：对表单当前值执行校验，返回汇总后的错误文案。
   *
   * 与 `submitForm` 的区别：
   * - 校验失败时不抛异常、不触发 `error` 事件，而是以返回值形式给出错误文案；
   * - 不重置 `changeRecords`，不改变提交语义，仅用于「探测」当前配置是否合法。
   *
   * 注意：本方法只改变「校验结果的返回方式」，并不负责「不污染页面表单状态」——
   * 若需对一份独立的「配置 + 值」做完全不影响页面上已渲染表单的校验，请使用 `validateForm`
   * （内部会新建一个隐藏的 MForm 实例，通过 `initValues` 传入待校验值，用完即卸载）。
   *
   * 典型用途：作为 `validateForm` 内部复用的校验实现；也可在已渲染的表单实例上主动调用，
   * 根据返回的错误文案自行决定后续处理（如记录节点错误状态）。
   *
   * @returns 校验通过返回空字符串 `''`，否则返回以 `<br>` 拼接的错误文案。
   */
  validate: async (): Promise<string> => {
    try {
      const result = await tMagicFormRef.value?.validate();
      // tdesign 通过返回值返回校验结果，element-plus 通过 throw error
      if (result !== true) {
        throw result;
      }
      return '';
    } catch (invalidFields: any) {
      return formatValidateError(invalidFields);
    }
  },

  getTextByName,
});
</script>
