<template>
  <div
    v-if="config"
    :id="config.id"
    :data-magic-id="config.id"
    :style="config.tip ? 'display: flex;align-items: baseline;' : ''"
    :class="`m-form-container m-container-${type || ''} ${config.className || ''}`"
  >
    <m-fields-hidden
      v-if="type === 'hidden'"
      :model="model"
      :config="config"
      :name="config.name"
      :disabled="disabled"
      :prop="itemProp"
    ></m-fields-hidden>

    <component
      v-else-if="items && !text && type && display"
      :key="key(config)"
      :size="size"
      :is="tagName"
      :model="model"
      :last-values="lastValues"
      :is-compare="isCompare"
      :config="config"
      :disabled="disabled"
      :name="name"
      :prop="itemProp"
      :step-active="stepActive"
      :expand-more="expand"
      :label-width="itemLabelWidth"
      @change="onChangeHandler"
      @addDiffCount="onAddDiffCount"
    ></component>

    <template v-else-if="type && display && !showDiff">
      <TMagicFormItem
        :style="config.tip ? 'flex: 1' : ''"
        :class="{ hidden: `${itemLabelWidth}` === '0' || !text }"
        :prop="itemProp"
        :label-width="itemLabelWidth"
        :rules="rule"
      >
        <template #label><span v-html="type === 'checkbox' ? '' : text" :title="config.labelTitle"></span></template>
        <TMagicTooltip v-if="tooltip">
          <component
            :key="key(config)"
            :size="size"
            :is="tagName"
            :model="model"
            :last-values="lastValues"
            :config="config"
            :name="name"
            :disabled="disabled"
            :prop="itemProp"
            @change="onChangeHandler"
            @addDiffCount="onAddDiffCount"
          ></component>
          <template #content>
            <div v-html="tooltip"></div>
          </template>
        </TMagicTooltip>

        <component
          v-else
          :key="key(config)"
          :size="size"
          :is="tagName"
          :model="model"
          :last-values="lastValues"
          :config="config"
          :name="name"
          :disabled="disabled"
          :prop="itemProp"
          @change="onChangeHandler"
          @addDiffCount="onAddDiffCount"
        ></component>

        <div v-if="extra && type !== 'table'" v-html="extra" class="m-form-tip"></div>
      </TMagicFormItem>

      <TMagicTooltip v-if="config.tip" placement="left">
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
        :style="config.tip ? 'flex: 1' : ''"
        :class="{ hidden: `${itemLabelWidth}` === '0' || !text }"
        :prop="itemProp"
        :label-width="itemLabelWidth"
        :rules="rule"
        style="background: #f7dadd"
      >
        <template #label><span v-html="type === 'checkbox' ? '' : text" :title="config.labelTitle"></span></template>
        <TMagicTooltip v-if="tooltip">
          <component
            :key="key(config)"
            :size="size"
            :is="tagName"
            :model="lastValues"
            :config="config"
            :name="name"
            :disabled="disabled"
            :prop="itemProp"
            @change="onChangeHandler"
          ></component>
          <template #content>
            <div v-html="tooltip"></div>
          </template>
        </TMagicTooltip>

        <component
          v-else
          :key="key(config)"
          :size="size"
          :is="tagName"
          :model="lastValues"
          :config="config"
          :name="name"
          :disabled="disabled"
          :prop="itemProp"
          @change="onChangeHandler"
        ></component>

        <div v-if="extra" v-html="extra" class="m-form-tip"></div>
      </TMagicFormItem>

      <TMagicTooltip v-if="config.tip" placement="left">
        <TMagicIcon style="line-height: 40px; margin-left: 5px"><warning-filled /></TMagicIcon>
        <template #content>
          <div v-html="config.tip"></div>
        </template>
      </TMagicTooltip>
      <!-- 当前内容 -->
      <TMagicFormItem
        :style="config.tip ? 'flex: 1' : ''"
        :class="{ hidden: `${itemLabelWidth}` === '0' || !text }"
        :prop="itemProp"
        :label-width="itemLabelWidth"
        :rules="rule"
        style="background: #def7da"
      >
        <template #label><span v-html="type === 'checkbox' ? '' : text" :title="config.labelTitle"></span></template>
        <TMagicTooltip v-if="tooltip">
          <component
            :key="key(config)"
            :size="size"
            :is="tagName"
            :model="model"
            :config="config"
            :name="name"
            :disabled="disabled"
            :prop="itemProp"
            @change="onChangeHandler"
          ></component>
          <template #content>
            <div v-html="tooltip"></div>
          </template>
        </TMagicTooltip>

        <component
          v-else
          :key="key(config)"
          :size="size"
          :is="tagName"
          :model="model"
          :config="config"
          :name="name"
          :disabled="disabled"
          :prop="itemProp"
          @change="onChangeHandler"
        ></component>

        <div v-if="extra" v-html="extra" class="m-form-tip"></div>
      </TMagicFormItem>

      <TMagicTooltip v-if="config.tip" placement="left">
        <TMagicIcon style="line-height: 40px; margin-left: 5px"><warning-filled /></TMagicIcon>
        <template #content>
          <div v-html="config.tip"></div>
        </template>
      </TMagicTooltip>
    </template>

    <template v-else-if="items && display">
      <template v-if="name || name === 0 ? model[name] : model">
        <Container
          v-for="item in items"
          :key="key(item)"
          :model="name || name === 0 ? model[name] : model"
          :last-values="name || name === 0 ? lastValues[name] || {} : lastValues"
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
import { computed, inject, ref, resolveComponent, watch, watchEffect } from 'vue';
import { WarningFilled } from '@element-plus/icons-vue';
import { isEqual } from 'lodash-es';

import { TMagicButton, TMagicFormItem, TMagicIcon, TMagicTooltip } from '@tmagic/design';

import { ChildConfig, ContainerCommonConfig, FormState, FormValue } from '../schema';
import { display as displayFunction, filterFunction, getRules } from '../utils/form';

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

const emit = defineEmits(['change', 'addDiffCount']);

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
  const { names } = props.config as any;
  if (names?.[0]) {
    [n] = names;
  } else if (name.value) {
    n = name.value;
  } else {
    return props.prop;
  }
  return `${props.prop}${props.prop ? '.' : ''}${n}`;
});

const tagName = computed(() => {
  const component = resolveComponent(`m-${items.value ? 'form' : 'fields'}-${type.value}`);
  if (typeof component !== 'string') return component;
  return 'm-fields-text';
});

const disabled = computed(() => props.disabled || filterFunction(mForm, props.config.disabled, props));

const text = computed(() => filterFunction(mForm, props.config.text, props));

const tooltip = computed(() => filterFunction(mForm, props.config.tooltip, props));

const extra = computed(() => filterFunction(mForm, props.config.extra, props));

const rule = computed(() => getRules(mForm, props.config.rules, props));

const type = computed((): string => {
  let { type } = props.config;
  if (typeof type === 'function') {
    type = type(mForm, {
      model: props.model,
    });
  }
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
    });
  }

  if (filter === 'number') {
    return +value;
  }

  return value;
};

const changeHandler = (onChange: any, value: FormValue | number | string) => {
  if (typeof onChange === 'function') {
    return onChange(mForm, value, {
      model: props.model,
      values: mForm?.initValues,
      formValue: mForm?.values,
      prop: itemProp.value,
      config: props.config,
    });
  }
};

const trimHandler = (trim: any, value: FormValue | number | string) => {
  if (typeof value === 'string' && trim) {
    return value.replace(/^\s*/, '').replace(/\s*$/, '');
  }
};

// 继续抛出给更高层级的组件
const onAddDiffCount = () => emit('addDiffCount');

const onChangeHandler = async function (v: FormValue, key?: string) {
  const { filter, onChange, trim, name, dynamicKey } = props.config as any;
  let value: FormValue | number | string = v;

  try {
    value = filterHandler(filter, v);
    value = (await changeHandler(onChange, value)) ?? value;
    value = trimHandler(trim, value) ?? value;
  } catch (e) {
    console.error(e);
  }

  // field内容下包含field-link时，model===value, 这里避免循环引用
  if ((name || name === 0) && props.model !== value && (v !== value || props.model[name] !== value)) {
    // eslint-disable-next-line vue/no-mutating-props
    props.model[name] = value;
  }
  // 动态表单类型，根据value和key参数，直接修改model
  if (key !== undefined && dynamicKey) {
    // eslint-disable-next-line vue/no-mutating-props
    props.model[key] = value;
  }
  emit('change', props.model);
};
</script>
