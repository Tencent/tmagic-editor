<template>
  <div class="m-fields-code-select">
    <m-form-table
      :config="tableConfig"
      :model="model[name]"
      name="hookData"
      :enableToggleMode="false"
      :prop="prop"
      :size="size"
      @change="changeHandler"
    >
      <template #operateCol="{ scope }">
        <Icon
          v-if="scope.row.codeId"
          :icon="editable ? Edit : View"
          class="edit-icon"
          @click="editCode(scope.row.codeId)"
        ></Icon>
      </template>
    </m-form-table>
  </div>
</template>

<script lang="ts" setup name="MEditorCodeSelect">
import { computed, defineEmits, defineProps, inject, watch } from 'vue';
import { Edit, View } from '@element-plus/icons-vue';
import { isEmpty, map } from 'lodash-es';

import { createValues, FormItem, FormState, TableConfig } from '@tmagic/form';
import { HookType, Id } from '@tmagic/schema';

import Icon from '../components/Icon.vue';
import { CodeParamStatement, HookData, Services } from '../type';
const services = inject<Services>('services');
const mForm = inject<FormState>('mForm');
const emit = defineEmits(['change']);

const props = defineProps<{
  config: {
    tableConfig?: TableConfig;
  };
  model: any;
  prop: string;
  name: string;
  size: 'mini' | 'small' | 'medium';
}>();
const codeDsl = computed(() => services?.codeBlockService.getCodeDsl());

const tableConfig = computed<FormItem>(() => {
  const defaultConfig = {
    dropSort: false,
    enableFullscreen: false,
    border: true,
    operateColWidth: 60,
    items: [
      {
        type: 'select',
        label: '代码块',
        name: 'codeId',
        width: '200px',
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
        onChange: (formState: any, codeId: Id, { model }: any) => {
          // 参数的items是根据函数生成的，当codeId变化后修正model的值，避免写入其他codeId的params
          model.params = {};
        },
      },
      {
        name: 'params',
        label: '参数',
        defaultValue: {},
        itemsFunction: (row: HookData) => {
          const paramsConfig = getParamsConfig(row.codeId);
          // 如果参数没有填值，则使用createValues补全空值
          if (isEmpty(row.params) || !row.params) {
            createValues(mForm, paramsConfig, {}, row.params);
          }
          return paramsConfig;
        },
      },
    ],
  };
  return {
    ...defaultConfig,
    ...props.config.tableConfig,
  };
});

const editable = computed(() => services?.codeBlockService.getEditStatus());

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

const getParamsConfig = (codeId: Id): CodeParamStatement[] => {
  if (!codeDsl.value) return [];
  const paramStatements = codeDsl.value[codeId]?.params;
  if (isEmpty(paramStatements)) return [];
  return paramStatements.map((paramState: CodeParamStatement) => ({
    labelWidth: '100px',
    text: paramState.name,
    ...paramState,
  }));
};

const editCode = (codeId: Id) => {
  services?.codeBlockService.setCodeEditorContent(true, codeId);
};
</script>
