<template>
  <div class="m-fields-code-select" :class="config.className">
    <TMagicCard :flat="config.flat">
      <MContainer
        :config="codeConfig"
        :size="size"
        class="code-select-content"
        :prop="prop"
        :disabled="disabled"
        :is-compare="isCompareMode"
        :last-values="lastValues?.[name]"
        :model="model[name]"
        @change="changeHandler"
      >
      </MContainer>
      <TMagicButton class="create-button fullWidth" :icon="Plus" :size="size" :disabled="disabled" @click="newHandler()"
        >添加{{ config.text }}</TMagicButton
      >
    </TMagicCard>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { isEmpty } from 'lodash-es';

import { HookCodeType, HookType } from '@tmagic/core';
import { TMagicButton, TMagicCard } from '@tmagic/design';
import type { CodeSelectConfig, ContainerChangeEventData, FieldProps, GroupListConfig } from '@tmagic/form';
import { MContainer } from '@tmagic/form';

import { useServices } from '@editor/hooks/use-services';

defineOptions({
  name: 'MFieldsCodeSelect',
});

const emit = defineEmits<{
  change: [v: any, eventData: ContainerChangeEventData];
}>();

const { dataSourceService, codeBlockService } = useServices();

const props = withDefaults(defineProps<FieldProps<CodeSelectConfig>>(), {});

/**
 * 对比模式判定：
 *
 * code-select 仅是对内部「钩子列表」group-list 的包裹，本身不渲染叶子字段。父级 `MFormContainer`
 * 已将其归入「自接管对比字段」（见 Container.vue 的 `SELF_DIFF_FIELD_TYPES`），即对比时只渲染一次
 * 本组件，并把当前值 `model` 与历史值 `lastValues` 一并传入，由本组件把 `is-compare`/`lastValues`
 * 透传给内部 MContainer，再由 group-list / code-select-col 等子级逐项展示前后差异。
 *
 * 注意：`model` 传入的是 `model[name]`（钩子值本身），因此 `lastValues` 也必须同层取 `lastValues[name]`，
 * 否则前后值的嵌套层级不一致会导致对比错位。
 *
 * 仅当存在历史值时才启用对比，避免 lastValues 缺失时退化为「全部新增」的空对比。
 */
const isCompareMode = computed(() => Boolean(props.isCompare && props.lastValues));
const newHandler = () => {
  const defaultCode = {
    codeType: HookCodeType.CODE,
    codeId: '',
  };
  const name = props.config.name || '';
  const hookData = props.model[name]?.hookData || [];
  emit('change', defaultCode, {
    modifyKey: `hookData.${hookData.length}`,
  });
};
const codeConfig = computed<GroupListConfig>(() => ({
  type: 'group-list',
  name: 'hookData',
  enableToggleMode: false,
  expandAll: true,
  addable: () => false,
  title: (mForm, { model, index }: any) => {
    if (model.codeType === HookCodeType.DATA_SOURCE_METHOD) {
      if (Array.isArray(model.codeId)) {
        if (model.codeId.length < 2) {
          return index;
        }

        const ds = dataSourceService.getDataSourceById(model.codeId[0]);
        return `${ds?.title} / ${model.codeId[1]}`;
      }

      return Array.isArray(model.codeId) ? model.codeId.join('/') : index;
    }

    const codeContent = codeBlockService.getCodeContentById(model.codeId);

    if (codeContent) {
      return codeContent.name;
    }

    return model.codeId || index;
  },
  titlePrefix: props.config.name === undefined ? undefined : String(props.config.name),
  items: [
    {
      text: '代码类型',
      type: 'select',
      name: 'codeType',
      labelPosition: 'right',
      rules: [{ typeMatch: true, trigger: 'change' }],
      options: [
        { value: HookCodeType.CODE, text: '代码块' },
        { value: HookCodeType.DATA_SOURCE_METHOD, text: '数据源方法' },
      ],
      defaultValue: HookCodeType.CODE,
      onChange: (_mForm, v: HookCodeType, { setModel }) => {
        if (v === HookCodeType.DATA_SOURCE_METHOD) {
          setModel('codeId', []);
        } else {
          setModel('codeId', '');
        }
        return v;
      },
    },
    {
      type: 'code-select-col',
      name: 'codeId',
      text: '代码块',
      rules: [{ typeMatch: true, trigger: 'change' }],

      display: (_mForm, { model }) => model.codeType !== HookCodeType.DATA_SOURCE_METHOD,
      notEditable: () => !codeBlockService.getEditStatus(),
    },
    {
      type: 'data-source-method-select',
      name: 'codeId',
      text: '数据源字段',
      rules: [{ typeMatch: true, trigger: 'change' }],
      display: (_mForm, { model }) => model.codeType === HookCodeType.DATA_SOURCE_METHOD,
      notEditable: () => !dataSourceService.get('editable'),
    },
  ],
}));

watch(
  () => props.model[props.name],
  (value) => {
    // 兼容旧的数据结构
    if (isEmpty(value)) {
      // 空值或者空数组
      props.model[props.name] = {
        hookType: HookType.CODE,
        hookData: [],
      };
    }
  },
  {
    immediate: true,
  },
);

const changeHandler = (v: any, eventData: ContainerChangeEventData) => emit('change', v, eventData);
</script>
