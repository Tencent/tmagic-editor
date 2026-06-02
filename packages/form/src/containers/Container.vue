<template>
  <div
    :data-tmagic-id="(config as Record<string, any>).id"
    :data-tmagic-form-item-prop="itemProp"
    :class="`m-form-container m-container-${type || ''} ${config.className || ''}${config.tip ? ' has-tip' : ''}`"
    :style="config.style"
  >
    <MHidden v-if="type === 'hidden'" :name="`${name}`" :prop="itemProp" :model="model"></MHidden>

    <component
      v-else-if="items && !text && type && display"
      v-bind="fieldsProps"
      :is="tagName"
      :model="model"
      :last-values="lastValues"
      :is-compare="isCompare"
      :step-active="stepActive"
      :expand-more="expand"
      :label-width="itemLabelWidth"
      :style="config.fieldStyle"
      @change="onChangeHandler"
      @addDiffCount="onAddDiffCount"
    ></component>

    <template v-else-if="type && display && !showDiff">
      <TMagicFormItem v-bind="formItemProps" :class="{ 'tmagic-form-hidden': `${itemLabelWidth}` === '0' || !text }">
        <template #label>
          <slot name="label" :config="config" :type="type" :text="text" :prop="itemProp" :disabled="disabled">
            <FormLabel
              :tip="config.tip"
              :type="type"
              :use-label="(config as CheckboxConfig).useLabel"
              :label-title="config.labelTitle"
              :text="text"
            ></FormLabel>
          </slot>
        </template>

        <TMagicTooltip v-if="tooltip.text" :placement="tooltip.placement">
          <component
            v-bind="fieldsProps"
            :is="tagName"
            :model="model"
            :last-values="lastValues"
            :is-compare="isCompare"
            @change="onChangeHandler"
            @addDiffCount="onAddDiffCount"
          ></component>
          <template #content>
            <div v-html="tooltip.text"></div>
          </template>
        </TMagicTooltip>

        <component
          v-else
          v-bind="fieldsProps"
          :is="tagName"
          :model="model"
          :last-values="lastValues"
          :is-compare="isCompare"
          @change="onChangeHandler"
          @addDiffCount="onAddDiffCount"
        ></component>
      </TMagicFormItem>

      <TMagicTooltip v-if="config.tip && type === 'checkbox' && !(config as CheckboxConfig).useLabel" placement="top">
        <TMagicIcon style="line-height: 40px; margin-left: 5px"><warning-filled /></TMagicIcon>
        <template #content>
          <div v-html="config.tip"></div>
        </template>
      </TMagicTooltip>
    </template>

    <!-- 对比 -->
    <template v-else-if="type && display && showDiff">
      <!-- 自接管对比的字段类型（如 vs-code）：只渲染一次组件，由字段内部用 diff 编辑器/视图自行展示前后差异 -->
      <TMagicFormItem
        v-if="isSelfDiffField"
        v-bind="formItemProps"
        :class="{
          'tmagic-form-hidden': `${itemLabelWidth}` === '0' || !text,
          'self-diff': true,
        }"
      >
        <template #label>
          <slot name="label" :config="config" :type="type" :text="text" :prop="itemProp" :disabled="disabled">
            <FormLabel
              :tip="config.tip"
              :type="type"
              :use-label="(config as CheckboxConfig).useLabel"
              :label-title="config.labelTitle"
              :text="text"
            ></FormLabel>
          </slot>
        </template>
        <TMagicTooltip v-if="tooltip.text" :placement="tooltip.placement">
          <component
            v-bind="fieldsProps"
            :is="tagName"
            :model="model"
            :last-values="lastValues"
            :is-compare="isCompare"
            @change="onChangeHandler"
          ></component>
          <template #content>
            <div v-html="tooltip.text"></div>
          </template>
        </TMagicTooltip>

        <component
          v-else
          v-bind="fieldsProps"
          :is="tagName"
          :model="model"
          :last-values="lastValues"
          :is-compare="isCompare"
          @change="onChangeHandler"
        ></component>
      </TMagicFormItem>

      <!-- 普通字段：渲染前后两份独立的组件用于对比 -->
      <template v-else>
        <!-- 上次内容 -->
        <TMagicFormItem
          v-bind="formItemProps"
          :class="{ 'tmagic-form-hidden': `${itemLabelWidth}` === '0' || !text, 'show-before-diff': true }"
        >
          <template #label>
            <slot name="label" :config="config" :type="type" :text="text" :prop="itemProp" :disabled="disabled">
              <FormLabel
                :tip="config.tip"
                :type="type"
                :use-label="(config as CheckboxConfig).useLabel"
                :label-title="config.labelTitle"
                :text="text"
              ></FormLabel>
            </slot>
          </template>
          <TMagicTooltip v-if="tooltip.text" :placement="tooltip.placement">
            <component v-bind="fieldsProps" :is="tagName" :model="lastValues" @change="onChangeHandler"></component>
            <template #content>
              <div v-html="tooltip.text"></div>
            </template>
          </TMagicTooltip>

          <component
            v-else
            v-bind="fieldsProps"
            :is="tagName"
            :model="lastValues"
            @change="onChangeHandler"
          ></component>
        </TMagicFormItem>

        <TMagicTooltip v-if="config.tip && type === 'checkbox' && !(config as CheckboxConfig).useLabel" placement="top">
          <TMagicIcon style="line-height: 40px; margin-left: 5px"><warning-filled /></TMagicIcon>
          <template #content>
            <div v-html="config.tip"></div>
          </template>
        </TMagicTooltip>

        <!-- 当前内容 -->
        <TMagicFormItem
          v-bind="formItemProps"
          :style="config.tip ? 'flex: 1' : ''"
          :class="{ 'tmagic-form-hidden': `${itemLabelWidth}` === '0' || !text, 'show-after-diff': true }"
        >
          <template #label>
            <slot name="label" :config="config" :type="type" :text="text" :prop="itemProp" :disabled="disabled">
              <FormLabel
                :tip="config.tip"
                :type="type"
                :use-label="(config as CheckboxConfig).useLabel"
                :label-title="config.labelTitle"
                :text="text"
              ></FormLabel>
            </slot>
          </template>
          <TMagicTooltip v-if="tooltip.text" :placement="tooltip.placement">
            <component v-bind="fieldsProps" :is="tagName" :model="model" @change="onChangeHandler"></component>
            <template #content>
              <div v-html="tooltip.text"></div>
            </template>
          </TMagicTooltip>

          <component v-else v-bind="fieldsProps" :is="tagName" :model="model" @change="onChangeHandler"></component>
        </TMagicFormItem>

        <TMagicTooltip v-if="config.tip && type === 'checkbox' && !(config as CheckboxConfig).useLabel" placement="top">
          <TMagicIcon style="line-height: 40px; margin-left: 5px"><warning-filled /></TMagicIcon>
          <template #content>
            <div v-html="config.tip"></div>
          </template>
        </TMagicTooltip>
      </template>
    </template>

    <template v-else-if="items && display">
      <template v-if="isValidName() ? model[name] : model">
        <Container
          v-for="item in items"
          :key="key(item)"
          :model="isValidName() ? model[name] : model"
          :last-values="isValidName() ? lastValues[name] || {} : lastValues"
          :is-compare="isCompare"
          :config="item"
          :size="size"
          :disabled="disabled"
          :step-active="stepActive"
          :expand-more="expand"
          :label-width="itemLabelWidth"
          :prop="itemProp"
          @change="onChangeHandler"
          @addDiffCount="onAddDiffCount"
        >
          <template v-if="$slots.label" #label="labelProps">
            <slot name="label" v-bind="labelProps"></slot>
          </template>
        </Container>
      </template>
    </template>

    <div style="text-align: center" v-if="config.expand && type !== 'fieldset'">
      <TMagicButton type="primary" size="small" :disabled="false" link @click="expandHandler">{{
        expand ? '收起配置' : '展开更多配置'
      }}</TMagicButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, readonly, ref, toRaw, watch, watchEffect } from 'vue';
import { WarningFilled } from '@element-plus/icons-vue';
import { isEqual } from 'lodash-es';

import { TMagicButton, TMagicFormItem, TMagicIcon, TMagicTooltip } from '@tmagic/design';
import { getValueByKeyPath } from '@tmagic/utils';

import MHidden from '../fields/Hidden.vue';
import type {
  CheckboxConfig,
  ComponentConfig,
  ContainerChangeEventData,
  ContainerCommonConfig,
  FormDiffConfig,
  FormItemConfig,
  FormSlots,
  FormState,
  FormValue,
  ToolTipConfigType,
} from '../schema';
import { FORM_DIFF_CONFIG_KEY } from '../schema';
import { getField } from '../utils/config';
import { createObjectProp, display as displayFunction, filterFunction, getRules } from '../utils/form';

import FormLabel from './FormLabel.vue';

defineOptions({
  name: 'MFormContainer',
});

defineSlots<FormSlots>();

const props = withDefaults(
  defineProps<{
    /** 表单值 */
    model: FormValue;
    /** 需对比的值（开启对比模式时传入） */
    lastValues?: FormValue;
    config: FormItemConfig;
    prop?: string;
    disabled?: boolean;
    labelWidth?: string | number;
    expandMore?: boolean;
    stepActive?: string | number;
    size?: string;
    /** 是否开启对比模式 */
    isCompare?: boolean;
  }>(),
  {
    prop: '',
    size: 'small',
    expandMore: false,
    lastValues: () => ({}),
    isCompare: false,
  },
);

const emit = defineEmits<{
  change: [v: any, eventData: ContainerChangeEventData];
  addDiffCount: [];
}>();

const mForm = inject<FormState | undefined>('mForm');

// 对比相关配置由 MForm 通过 provide 下发，这里直接 inject，无需逐层透传 prop。
const diffConfig = inject<FormDiffConfig>(FORM_DIFF_CONFIG_KEY, {});

const expand = ref(false);

const name = computed(() => props.config.name || '');

// 是否展示两个版本的对比内容
//
// 默认逻辑：在对比模式下用 lodash isEqual 比较当前值与历史值，不相等则展示对比。
// 若调用方通过 MForm 的 `showDiff` 注入了自定义判断函数，则完全以其返回值为准，
// 便于业务侧自定义"语义上相等"的特殊场景（例如空字符串与空 hook 结构）。
const showDiff = computed(() => {
  if (!props.isCompare) return false;
  if (!name.value) return false;

  const curValue = props.model[name.value];
  const lastValue = props.lastValues[name.value];

  const customShowDiff = diffConfig.showDiff;
  if (typeof customShowDiff === 'function') {
    return Boolean(customShowDiff({ curValue, lastValue, config: props.config }));
  }

  return !isEqual(curValue, lastValue);
});

const items = computed(() => (props.config as ContainerCommonConfig).items);

const itemProp = computed(() => {
  let n: string | number = '';
  if (name.value) {
    n = name.value;
  } else {
    return props.prop;
  }

  if (typeof props.prop !== 'undefined' && props.prop !== '') {
    return `${props.prop}.${n}`;
  }

  return `${n}`;
});

const type = computed((): string => {
  let type = 'type' in props.config ? props.config.type : '';
  type = type && filterFunction<string>(mForm, type, props);
  if (type === 'form') return '';
  if (type === 'container') return '';
  return type?.replace(/([A-Z])/g, '-$1').toLowerCase() || (items.value ? '' : 'text');
});

const tagName = computed(() => {
  if (type.value === 'component' && (props.config as ComponentConfig).component) {
    return (props.config as ComponentConfig).component;
  }

  return getField(type.value || 'container') || `m-${items.value ? 'form' : 'fields'}-${type.value}`;
});

/**
 * 自接管对比的字段类型白名单。
 *
 * 这类字段在 `isCompare === true` 且存在差异时，不再由 Container 渲染前后两份独立组件来对比，
 * 而是只渲染一次组件，将 `model` / `lastValues` / `isCompare` 一并传给字段组件，
 * 由字段组件内部自行展示前后差异（典型场景：vs-code 字段使用 monaco 自带的 diff 编辑器）。
 *
 * 这样做的好处：
 * 1. 避免重型字段（如 monaco 编辑器）在对比模式下被实例化两次，节省资源；
 * 2. 提供更专业的对比视觉效果（如 monaco diff 的行级高亮、左右滚动同步等）。
 *
 * 注意：像 `event-select` / `code-select-col` 这类内部由列表 / 嵌套子表单组成的复合字段，若按默认逻辑
 * 渲染前后两份独立组件，会出现两套下拉框 + 两份参数表单（或两套「添加事件」按钮、两份完整面板），
 * 体验很差。这类字段在内部把 `is-compare`/`lastValues` 透传给子级容器，由子级逐项展示差异，
 * 因此同样归类为自接管对比字段。
 */
const DEFAULT_SELF_DIFF_FIELD_TYPES = ['vs-code', 'event-select', 'code-select-col', 'code-select'];

// 最终生效的自接管对比字段类型集合。
//
// - 未自定义：使用内置默认类型；
// - 自定义传数组：在内置类型基础上「追加」；
// - 自定义传函数：以函数返回值为「最终」完整列表（可完全替换内置项）。
const effectiveSelfDiffFieldTypes = computed<Set<string>>(() => {
  const custom = diffConfig.selfDiffFieldTypes;

  if (typeof custom === 'function') {
    return new Set(custom([...DEFAULT_SELF_DIFF_FIELD_TYPES]));
  }

  if (Array.isArray(custom)) {
    return new Set([...DEFAULT_SELF_DIFF_FIELD_TYPES, ...custom]);
  }

  return new Set(DEFAULT_SELF_DIFF_FIELD_TYPES);
});

const isSelfDiffField = computed(() => effectiveSelfDiffFieldTypes.value.has(type.value));

const disabled = computed(() => props.disabled || filterFunction(mForm, props.config.disabled, props));

const text = computed(() => filterFunction(mForm, props.config.text, props));

const tooltip = computed(() => {
  const config = filterFunction<ToolTipConfigType>(mForm, props.config.tooltip, props);
  if (typeof config === 'string') {
    return {
      text: config,
      placement: 'top',
    };
  }

  return {
    text: config?.text,
    placement: config?.placement || 'top',
  };
});

const rule = computed(() => getRules(mForm, props.config.rules, props));

const display = computed((): boolean => {
  const value = displayFunction(mForm, props.config.display, props);

  if (value === 'expand') {
    return expand.value;
  }
  return value;
});

const fieldsProps = computed(() => ({
  size: props.size,
  config: props.config,
  name: name.value,
  disabled: disabled.value,
  prop: itemProp.value,
  key: (props.config as Record<string, any>)[mForm?.keyProps],
  style: props.config.fieldStyle,
}));

const formItemProps = computed(() => ({
  prop: itemProp.value,
  labelWidth: itemLabelWidth.value,
  labelPosition: props.config.labelPosition,
  rules: rule.value,
  extra: filterFunction(mForm, props.config.extra, props),
}));

const itemLabelWidth = computed(() => props.config.labelWidth ?? props.labelWidth);

watchEffect(() => {
  expand.value = props.expandMore;
});

// 监听是否展示对比内容，如果出现差异项则触发差异数计数事件
watch(
  showDiff,
  (showDiff) => {
    if (type.value === 'hidden') return;
    if (items.value && !text.value && type.value && display.value) return;
    if (display.value && showDiff && type.value) {
      emit('addDiffCount');
    }
  },
  {
    immediate: true,
  },
);

const expandHandler = () => (expand.value = !expand.value);

const key = (config: any) => config[mForm?.keyProps];

const filterHandler = (filter: any, value: FormValue | number | string) => {
  if (typeof filter === 'function') {
    return filter(mForm, value, {
      model: props.model,
      values: mForm?.initValues,
      formValue: mForm?.values,
      prop: itemProp.value,
      config: props.config,
      getFormValue: (prop: string) => getValueByKeyPath(prop, mForm?.values || props.model),
    });
  }

  if (filter === 'number') {
    return +value;
  }

  return value;
};

const trimHandler = (trim: any, value: FormValue | number | string) => {
  if (typeof value === 'string' && trim) {
    return value.replace(/^\s*/, '').replace(/\s*$/, '');
  }
};

// 继续抛出给更高层级的组件
const onAddDiffCount = () => emit('addDiffCount');

const hasModifyKey = (eventDataItem: ContainerChangeEventData) =>
  typeof eventDataItem?.modifyKey !== 'undefined' && eventDataItem.modifyKey !== '';

const isValidName = () => {
  const valueType = typeof name.value;
  if (valueType !== 'string' && valueType !== 'symbol' && valueType !== 'number') {
    return false;
  }

  if (name.value === '') {
    return false;
  }

  if (typeof name.value === 'number') {
    return name.value >= 0;
  }

  return true;
};

const createModelProxy = (
  target: any,
  setModelFn: (_key: string, _value: any) => void,
  pathPrefix: string = '',
): any => {
  return new Proxy(target, {
    get: (obj, key: string) => {
      const value = obj[key];
      if (value && typeof value === 'object') {
        const newPath = pathPrefix ? `${pathPrefix}.${key}` : key;
        return createModelProxy(value, setModelFn, newPath);
      }
      return value;
    },
    set: (obj, key: string, value) => {
      setModelFn(pathPrefix ? `${pathPrefix}.${key}` : key, value);
      return true;
    },
  });
};

const onChangeHandler = async function (v: any, eventData: ContainerChangeEventData = {}) {
  const { filter, onChange, trim } = props.config as any;
  let value: FormValue | number | string | any[] = toRaw(v);
  const changeRecords = eventData.changeRecords || [];
  const newChangeRecords = [...changeRecords];

  try {
    value = filterHandler(filter, v);

    if (typeof onChange === 'function') {
      const setModel = (key: string, value: any) => {
        newChangeRecords.push({ propPath: createObjectProp(itemProp.value, key, props.config.name), value });
      };

      const setFormValue = (key: string, value: any) => {
        newChangeRecords.push({ propPath: key, value });
      };

      value =
        (await onChange(mForm, value, {
          model: createModelProxy(props.model, setModel),
          values: mForm ? readonly(mForm.initValues) : null,
          formValue: createModelProxy(mForm?.values || {}, setFormValue),
          prop: itemProp.value,
          config: props.config,
          changeRecords: newChangeRecords,
          setModel,
          setFormValue,
          getFormValue: (prop: string) => getValueByKeyPath(prop, mForm?.values || props.model),
        })) ?? value;
    }
    value = trimHandler(trim, value) ?? value;
  } catch (e) {
    console.error(e);
  }

  let valueProp = itemProp.value;

  if (hasModifyKey(eventData)) {
    valueProp = valueProp ? `${valueProp}.${eventData.modifyKey}` : eventData.modifyKey!;

    // 需要清除掉modifyKey，不然往上层抛出后还会被认为需要修改
    delete eventData.modifyKey;
  }

  if (changeRecords.length === 0) {
    newChangeRecords.push({
      propPath: valueProp,
      value,
    });
  }

  emit('change', props.model, {
    ...eventData,
    changeRecords: newChangeRecords,
  });
};
</script>
