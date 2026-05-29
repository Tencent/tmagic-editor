<template>
  <div class="m-fields-code-select-col">
    <div class="code-select-container">
      <!-- 代码块下拉框 -->
      <!-- 对比模式下交由 MFormContainer 展示下拉框的前后差异（codeId 变化时高亮新旧代码块名），
           普通模式仍直接渲染 MSelect 以保留选择 / 写值逻辑 -->
      <MFormContainer
        v-if="isCompareMode"
        class="select"
        :config="selectConfig"
        :model="model"
        :last-values="lastValues"
        :is-compare="true"
        :size="size"
        :prop="prop"
      ></MFormContainer>
      <MSelect
        v-else
        class="select"
        :config="selectConfig"
        :name="name"
        :model="model"
        :size="size"
        :prop="prop"
        @change="onCodeIdChangeHandler"
      ></MSelect>

      <!-- 查看/编辑按钮：对比模式为只读，不展示 -->
      <TMagicButton
        v-if="!isCompareMode && model[name] && hasCodeBlockSidePanel"
        class="m-fields-select-action-button"
        :size="size"
        @click="editCode(model[name])"
      >
        <MIcon :icon="!notEditable ? Edit : View"></MIcon>
      </TMagicButton>
    </div>

    <!-- 参数填写框 -->
    <CodeParams
      v-if="paramsConfig.length"
      name="params"
      :key="model[name]"
      :model="model"
      :last-values="lastValues"
      :is-compare="isCompareMode"
      :size="size"
      :disabled="disabled"
      :params-config="paramsConfig"
      @change="onParamsChangeHandler"
    ></CodeParams>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';
import { Edit, View } from '@element-plus/icons-vue';
import { isEmpty, map } from 'lodash-es';

import type { Id } from '@tmagic/core';
import { TMagicButton } from '@tmagic/design';
import {
  type CodeSelectColConfig,
  type ContainerChangeEventData,
  createValues,
  type FieldProps,
  filterFunction,
  type FormItemConfig,
  type FormState,
  MContainer as MFormContainer,
  MSelect,
  type SelectConfig,
} from '@tmagic/form';

import CodeParams from '@editor/components/CodeParams.vue';
import MIcon from '@editor/components/Icon.vue';
import { useServices } from '@editor/hooks/use-services';
import type { CodeParamStatement, EventBus } from '@editor/type';
import { SideItemKey } from '@editor/type';

defineOptions({
  name: 'MFieldsCodeSelectCol',
});

const mForm = inject<FormState | undefined>('mForm');
const { codeBlockService, uiService } = useServices();
const eventBus = inject<EventBus>('eventBus');
const emit = defineEmits<{
  change: [v: any, eventData: ContainerChangeEventData];
}>();

const props = withDefaults(defineProps<FieldProps<CodeSelectColConfig>>(), {
  disabled: false,
});

/**
 * 对比模式判定：
 *
 * code-select-col 由「代码块下拉框 + 参数子表单」组成，属于复合字段。父级 `MFormContainer` 已将其
 * 归入「自接管对比字段」（见 Container.vue 的 `SELF_DIFF_FIELD_TYPES`），即对比时只渲染一次本组件，
 * 并把当前值 `model` 与历史值 `lastValues` 一并传入，由本组件把 `is-compare`/`lastValues` 透传给
 * 内部的下拉框（MFormContainer）与参数表单（CodeParams），逐项展示前后差异。
 *
 * 仅当存在历史值时才启用对比，避免 lastValues 缺失时退化为「全部新增」的空对比。
 */
const isCompareMode = computed(() => Boolean(props.isCompare && props.lastValues));

const notEditable = computed(() => filterFunction(mForm, props.config.notEditable, props));

const hasCodeBlockSidePanel = computed(() =>
  (uiService.get('sideBarItems') || []).find((item) => item.$key === SideItemKey.CODE_BLOCK),
);

/**
 * 根据代码块id获取代码块参数配置
 * @param codeId 代码块ID
 */
const getParamItemsConfig = (codeId?: Id): CodeParamStatement[] => {
  if (!codeDsl.value || !codeId) return [];

  const paramStatements = codeDsl.value[codeId]?.params;

  if (isEmpty(paramStatements)) return [];

  return paramStatements.map((paramState: CodeParamStatement) => ({
    labelWidth: '100px',
    text: paramState.name,
    ...paramState,
  }));
};

const codeDsl = computed(() => codeBlockService.getCodeDsl());
const paramsConfig = ref<CodeParamStatement[]>(getParamItemsConfig(props.model[props.name]));

watch(
  () => props.model[props.name],
  (v, preV) => {
    if (v !== preV) {
      paramsConfig.value = getParamItemsConfig(v);
    }
  },
);

const selectConfig: SelectConfig = {
  type: 'select',
  name: props.name,
  disabled: props.disabled,
  options: () => {
    if (codeDsl.value) {
      return map(codeDsl.value, (value, key) => ({
        text: `${value.name}（${key}）`,
        label: `${value.name}（${key}）`,
        value: key,
      }));
    }
    return [];
  },
};

const onCodeIdChangeHandler = (value: any) => {
  // 通过下拉框选择的codeId变化后修正model的值，避免写入其他codeId的params
  paramsConfig.value = getParamItemsConfig(value);

  const changeRecords = [
    {
      propPath: props.prop,
      value,
    },
  ];

  changeRecords.push({
    propPath: props.prop.replace(`${props.name}`, 'params'),
    value: paramsConfig.value.length
      ? createValues(mForm, paramsConfig.value as unknown as FormItemConfig[], {}, props.model.params)
      : {},
  });

  emit('change', value, {
    changeRecords,
  });
};

/**
 * 参数值修改更新
 */
const onParamsChangeHandler = (value: any, eventData: ContainerChangeEventData) => {
  eventData.changeRecords?.forEach((record) => {
    record.propPath = `${props.prop.replace(`${props.name}`, '')}${record.propPath}`;
  });
  emit('change', props.model[props.name], eventData);
};

const editCode = (id: string) => {
  eventBus?.emit('edit-code', id);
};
</script>
