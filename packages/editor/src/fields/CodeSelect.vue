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

import { HookCodeType } from '@tmagic/core';
import { TMagicButton, TMagicCard } from '@tmagic/design';
import type { CodeSelectConfig, ContainerChangeEventData, FieldProps } from '@tmagic/form';
import { MContainer } from '@tmagic/form';

import { createCodeSelectConfig, normalizeCodeSelectValue } from '@editor/fields/configs/codeSelect';

defineOptions({
  name: 'MFieldsCodeSelect',
});

const emit = defineEmits<{
  change: [v: any, eventData: ContainerChangeEventData];
}>();

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
const codeConfig = computed(() => createCodeSelectConfig(props.config));

watch(
  () => props.model[props.name],
  () => {
    // 兼容旧的数据结构
    normalizeCodeSelectValue(props.model, props.name);
  },
  {
    immediate: true,
  },
);

const changeHandler = (v: any, eventData: ContainerChangeEventData) => emit('change', v, eventData);
</script>
