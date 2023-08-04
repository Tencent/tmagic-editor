<template>
  <div class="m-fields-dynamic-field">
    <TMagicForm size="small">
      <TMagicFormItem v-for="key in Object.keys(fieldMap.value)" :key="key" :label="fieldLabelMap.value[key]">
        <TMagicInput
          v-model="fieldMap.value[key]"
          :placeholder="fieldLabelMap.value[key]"
          @change="inputChangeHandler(key)"
        ></TMagicInput>
      </TMagicFormItem>
    </TMagicForm>
  </div>
</template>

<script lang="ts" setup>
/**
 * 动态表单，目前只支持input类型字段
 * inputType: 'dynamic-field',
 * text: '动态表单',
 * dynamicKey: 'keyname', 如果model[dynamicKey]变化，表单字段变化
 * returnFields(config,model,request): 函数，返回字段列表[{name:'',label:'',defaultValue:''}]
 *
 * 特别注意！！！field的上一级必须extensible: true，才能保存未声明的字段
 */

import { onBeforeUnmount, reactive, watch } from 'vue';

import { TMagicForm, TMagicFormItem, TMagicInput } from '@tmagic/design';

import type { DynamicFieldConfig, FieldProps } from '../schema';
import { getConfig } from '../utils/config';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormDynamicField',
});

const props = defineProps<FieldProps<DynamicFieldConfig>>();

const emit = defineEmits(['change']);

useAddField(props.prop);

const request = getConfig<Function>('request');
const fieldMap = reactive<{ [key: string]: any }>({
  value: {},
});
const fieldLabelMap = reactive<{ [key: string]: any }>({
  value: {},
});

const changeFieldMap = async () => {
  if (typeof props.config.returnFields !== 'function' || !props.model) return;
  const fields = await props.config.returnFields(props.config, props.model, request);
  fieldMap.value = {};
  fieldLabelMap.value = {};
  fields.forEach((v) => {
    if (typeof v !== 'object' || v.name === undefined) return;
    let oldVal = props.model?.[v.name] || '';
    if (!oldVal && v.defaultValue !== undefined) {
      oldVal = v.defaultValue;
      emit('change', oldVal, v.name);
    }
    fieldMap.value[v.name] = oldVal;
    fieldLabelMap.value[v.name] = v.label || '';
  });
};

const unwatch = watch(
  () => props.model?.[props.config.dynamicKey],
  (val) => {
    if (val !== '') {
      changeFieldMap();
    }
  },
  {
    immediate: true,
  },
);

onBeforeUnmount(() => {
  if (typeof unwatch === 'function') {
    unwatch();
  }
});

const inputChangeHandler = (key: string) => {
  emit('change', fieldMap.value[key], key);
};
</script>
