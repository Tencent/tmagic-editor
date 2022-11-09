<template>
  <div class="m-fields-code-select" :key="fieldKey">
    <TMagicCard shadow="never">
      <m-form-table
        :config="tableConfig"
        :model="model[name]"
        :name="tableConfig.name"
        :prop="prop"
        :size="size"
        @change="changeHandler"
      >
      </m-form-table>
    </TMagicCard>
  </div>
</template>

<script lang="ts" setup name="MEditorCodeSelect">
import { computed, defineEmits, defineProps, inject, ref } from 'vue';
import { map, xor } from 'lodash-es';

import { TMagicCard } from '@tmagic/design';
import { FormState, TableConfig } from '@tmagic/form';

import type { Services } from '../type';
import { CodeSelectOp } from '../type';
const services = inject<Services>('services');
const form = inject<FormState>('mForm');
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

const tableConfig = computed(() => {
  const defaultConfig = {
    dropSort: true,
    items: [
      {
        type: 'select',
        label: '代码块',
        name: 'codeId',
        options: async () => {
          const codeDsl = await services?.codeBlockService.getCodeDsl();
          if (codeDsl) {
            return map(codeDsl, (value, key) => ({
              text: `${value.name}（${key}）`,
              label: `${value.name}（${key}）`,
              value: key,
            }));
          }
          return [];
        },
      },
      // {
      //   label: '参数',
      //   name: 'params',
      //   filter: v=>JSON.stringify(v)
      // },
    ],
  };
  return {
    name: 'data',
    ...defaultConfig,
    ...props.config.tableConfig,
  };
});

// const selectModel = computed(() => {
//   console.log("props.model[props.name].data",props.model[props.name].data)
//   return {
//     [props.name]: props.model[props.name]?.data?.map((item: { codeId: Id }) => item.codeId) || []
//   }
// });

// watch(
//   () => selectModel.value,
//   () => {
//     const selectData
//     if (isEmpty(selectModel)) return;
//     const hookData = selectModel.value.map((selectedCodeId: Id) => ({
//       codeId: selectedCodeId,
//     }));
//     console.log('hookData', hookData);
//     if (isEmpty(hookData)) return;
//     if (!props.model[props.name]?.data || isEmpty(props.model[props.name]?.data)) {
//       // 新增hook
//       props.model[props.name] = {
//         hookType: HookType.CODE,
//         data: hookData,
//       };
//     } else {
//       // 新增hook data
//       props.model[props.name].data = {
//         ...props.model[props.name].data,
//         ...hookData,
//       };
//     }
//     console.log('-0-props.model[props.name]--', props.model[props.name]);
//   },
//   {
//     deep: true,
//     immediate: true,
//   },
// );

const fieldKey = ref('');
const multiple = ref(true);
const lastTagSnapshot = ref<string[]>([]);

// watchEffect(async () => {
//   if (isEmpty(selectModel)) return;
//   const combineNames = await Promise.all(
//     selectModel.value[props.name].map(async (id: string) => {
//       const { name = '' } = (await services?.codeBlockService.getCodeContentById(id)) || {};
//       return name;
//     }),
//   );
//   fieldKey.value = combineNames.join('-');
// });

const changeHandler = async (value: any) => {
  console.log('---value--', value);
  let codeIds = value;
  if (typeof value === 'string') {
    multiple.value = false;
    codeIds = value ? [value] : [];
  }
  await setCombineRelation(codeIds);
  emit('change', value);
};

// 同步绑定关系
const setCombineRelation = async (codeIds: string[]) => {
  // 组件id
  const { id = '' } = services?.editorService.get('node') || {};

  // 兼容单选
  let opFlag = CodeSelectOp.CHANGE;
  let diffValues = codeIds;
  if (multiple.value) {
    // initValues为表单初始值，当表单内容发生变化时，initValues也会更新，可以理解为上一次表单内容的快照
    lastTagSnapshot.value = form?.initValues[props.name] || [];
    opFlag = codeIds.length < lastTagSnapshot.value.length ? CodeSelectOp.DELETE : CodeSelectOp.ADD;
    diffValues = xor(codeIds, lastTagSnapshot.value) as string[];
  }
  // 记录绑定关系
  await services?.codeBlockService.setCombineRelation(id, diffValues, opFlag, props.prop);
};

// const viewHandler = async () => {
//   if (props.model[props.name].length === 0) {
//     tMagicMessage.error('请先绑定代码块');
//     return;
//   }
//   // 记录当前已被绑定的代码块，为查看弹窗的展示内容
//   await services?.codeBlockService.setCombineIds(props.model[props.name]);
//   await services?.codeBlockService.setMode(CodeEditorMode.LIST);
//   services?.codeBlockService.setCodeEditorContent(true, props.model[props.name][0]);
// };
</script>
