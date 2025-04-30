<template>
  <div class="m-fields-code-select" :class="config.className">
    <TMagicCard>
      <MContainer
        :config="codeConfig"
        :size="size"
        :prop="prop"
        :disabled="disabled"
        :lastValues="lastValues"
        :model="model[name]"
        @change="changeHandler"
      >
      </MContainer>
    </TMagicCard>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { isEmpty } from 'lodash-es';

import { HookCodeType, HookType } from '@tmagic/core';
import { TMagicCard } from '@tmagic/design';
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

const codeConfig = computed<GroupListConfig>(() => ({
  type: 'group-list',
  name: 'hookData',
  enableToggleMode: false,
  expandAll: true,
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
    return model.codeId || index;
  },
  items: [
    {
      type: 'row',
      items: [
        {
          type: 'select',
          name: 'codeType',
          span: 6,
          options: [
            { value: HookCodeType.CODE, text: '代码块' },
            { value: HookCodeType.DATA_SOURCE_METHOD, text: '数据源方法' },
          ],
          defaultValue: 'code',
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
          span: 18,
          labelWidth: 0,
          display: (_mForm, { model }) => model.codeType !== HookCodeType.DATA_SOURCE_METHOD,
          notEditable: () => !codeBlockService.getEditStatus(),
        },
        {
          type: 'data-source-method-select',
          name: 'codeId',
          span: 18,
          labelWidth: 0,
          display: (_mForm, { model }) => model.codeType === HookCodeType.DATA_SOURCE_METHOD,
          notEditable: () => !dataSourceService.get('editable'),
        },
      ],
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
