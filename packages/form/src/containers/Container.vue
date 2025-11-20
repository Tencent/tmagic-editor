<template>
  <div
    :data-tmagic-id="config.id"
    :data-tmagic-form-item-prop="itemProp"
    :class="`m-form-container m-container-${type || ''} ${config.className || ''}${config.tip ? ' has-tip' : ''}`"
    :style="config.style"
  >
    <m-fields-hidden v-if="type === 'hidden'" v-bind="fieldsProps" :model="model"></m-fields-hidden>

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
          <FormLabel
            :tip="config.tip"
            :type="type"
            :use-label="config.useLabel"
            :label-title="config.labelTitle"
            :text="text"
          ></FormLabel>
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

      <TMagicTooltip v-if="config.tip && type === 'checkbox' && !config.useLabel" placement="top">
        <TMagicIcon style="line-height: 40px; margin-left: 5px"><warning-filled /></TMagicIcon>
        <template #content>
          <div v-html="config.tip"></div>
        </template>
      </TMagicTooltip>
    </template>

    <!-- 对比 -->
    <template v-else-if="type && display && showDiff">
      <!-- 上次内容 -->
      <TMagicFormItem
        v-bind="formItemProps"
        :class="{ 'tmagic-form-hidden': `${itemLabelWidth}` === '0' || !text, 'show-diff': true }"
      >
        <template #label>
          <FormLabel
            :tip="config.tip"
            :type="type"
            :use-label="config.useLabel"
            :label-title="config.labelTitle"
            :text="text"
          ></FormLabel>
        </template>
        <TMagicTooltip v-if="tooltip.text" :placement="tooltip.placement">
          <component v-bind="fieldsProps" :is="tagName" :model="lastValues" @change="onChangeHandler"></component>
          <template #content>
            <div v-html="tooltip.text"></div>
          </template>
        </TMagicTooltip>

        <component v-else v-bind="fieldsProps" :is="tagName" :model="lastValues" @change="onChangeHandler"></component>
      </TMagicFormItem>

      <TMagicTooltip v-if="config.tip && type === 'checkbox' && !config.useLabel" placement="top">
        <TMagicIcon style="line-height: 40px; margin-left: 5px"><warning-filled /></TMagicIcon>
        <template #content>
          <div v-html="config.tip"></div>
        </template>
      </TMagicTooltip>

      <!-- 当前内容 -->
      <TMagicFormItem
        v-bind="formItemProps"
        :style="config.tip ? 'flex: 1' : ''"
        :class="{ 'tmagic-form-hidden': `${itemLabelWidth}` === '0' || !text, 'show-diff': true }"
      >
        <template #label>
          <FormLabel
            :tip="config.tip"
            :type="type"
            :use-label="config.useLabel"
            :label-title="config.labelTitle"
            :text="text"
          ></FormLabel>
        </template>
        <TMagicTooltip v-if="tooltip.text" :placement="tooltip.placement">
          <component v-bind="fieldsProps" :is="tagName" :model="model" @change="onChangeHandler"></component>
          <template #content>
            <div v-html="tooltip.text"></div>
          </template>
        </TMagicTooltip>

        <component v-else v-bind="fieldsProps" :is="tagName" :model="model" @change="onChangeHandler"></component>
      </TMagicFormItem>

      <TMagicTooltip v-if="config.tip && type === 'checkbox' && !config.useLabel" placement="top">
        <TMagicIcon style="line-height: 40px; margin-left: 5px"><warning-filled /></TMagicIcon>
        <template #content>
          <div v-html="config.tip"></div>
        </template>
      </TMagicTooltip>
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
        ></Container>
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

import type {
  ChildConfig,
  ContainerChangeEventData,
  ContainerCommonConfig,
  FormState,
  FormValue,
  ToolTipConfigType,
} from '../schema';
import { display as displayFunction, filterFunction, getRules } from '../utils/form';

import FormLabel from './FormLabel.vue';

defineOptions({
  name: 'MFormContainer',
});

const props = withDefaults(
  defineProps<{
    /** 表单值 */
    model: FormValue;
    /** 需对比的值（开启对比模式时传入） */
    lastValues?: FormValue;
    config: ChildConfig;
    prop?: string;
    disabled?: boolean;
    labelWidth?: string;
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

const expand = ref(false);

const name = computed(() => props.config.name || '');
// 是否展示两个版本的对比内容
const showDiff = computed(() => {
  if (!props.isCompare) return false;
  const curValue = name.value ? props.model[name.value] : props.model;
  const lastValue = name.value ? props.lastValues[name.value] : props.lastValues;
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

const tagName = computed(() => {
  if (type.value === 'component' && props.config.component) {
    return props.config.component;
  }
  return `m-${items.value ? 'form' : 'fields'}-${type.value}`;
});

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

const type = computed((): string => {
  let { type } = props.config;
  type = type && filterFunction<string>(mForm, type, props);
  if (type === 'form') return '';
  if (type === 'container') return '';
  return type?.replace(/([A-Z])/g, '-$1').toLowerCase() || (items.value ? '' : 'text');
});

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
  key: props.config[mForm?.keyProps],
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
        if (props.config.name) {
          newChangeRecords.push({ propPath: itemProp.value.replace(`${props.config.name}`, key), value });
        } else {
          newChangeRecords.push({ propPath: itemProp.value, value });
        }
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
