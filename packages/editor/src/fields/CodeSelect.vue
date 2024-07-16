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
import { computed, inject, watch } from 'vue';
import { isEmpty } from 'lodash-es';

import { TMagicCard } from '@tmagic/design';
import type { FieldProps, FormItem } from '@tmagic/form';
import { FormState, MContainer } from '@tmagic/form';
import { HookCodeType, HookType } from '@tmagic/schema';

import type { Services } from '@editor/type';

defineOptions({
  name: 'MFieldsCodeSelect',
});

const emit = defineEmits(['change']);

const services = inject<Services>('services');

const props = withDefaults(
  defineProps<
    FieldProps<
      {
        className?: string;
      } & FormItem
    >
  >(),
  {},
);

const codeConfig = computed(() => ({
  type: 'group-list',
  name: 'hookData',
  enableToggleMode: false,
  expandAll: true,
  title: (mForm: FormState, { model, index }: any) => {
    if (model.codeType === HookCodeType.DATA_SOURCE_METHOD) {
      if (Array.isArray(model.codeId)) {
        if (model.codeId.length < 2) {
          return index;
        }

        const ds = services?.dataSourceService.getDataSourceById(model.codeId[0]);
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
          onChange: (mForm: FormState, v: HookCodeType, { model }: any) => {
            if (v === HookCodeType.DATA_SOURCE_METHOD) {
              model.codeId = [];
            } else {
              model.codeId = '';
            }

            return v;
          },
        },
        {
          type: 'code-select-col',
          name: 'codeId',
          span: 18,
          labelWidth: 0,
          display: (mForm: FormState, { model }: any) => model.codeType !== HookCodeType.DATA_SOURCE_METHOD,
          notEditable: () => !services?.codeBlockService.getEditStatus(),
        },
        {
          type: 'data-source-method-select',
          name: 'codeId',
          span: 18,
          labelWidth: 0,
          display: (mForm: FormState, { model }: any) => model.codeType === HookCodeType.DATA_SOURCE_METHOD,
          notEditable: () => !services?.dataSourceService.get('editable'),
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

const changeHandler = async () => {
  emit('change', props.model[props.name]);
};
</script>
