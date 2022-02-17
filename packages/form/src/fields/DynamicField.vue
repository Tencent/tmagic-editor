<template>
  <div class="m-fields-dynamic-field">
    <el-form size="small">
      <el-form-item v-for="key in Object.keys(fieldMap.value)" :key="key" :label="fieldLabelMap.value[key]">
        <el-input
          v-model="fieldMap.value[key]"
          :placeholder="fieldLabelMap.value[key]"
          @change="inputChangeHandler(key)"
        ></el-input>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts">
/**
 * 动态表单，目前只支持input类型字段
 * inputType: 'dynamic-field',
 * text: '动态表单',
 * dynamicKey: 'keyname', 如果model[dynamicKey]变化，表单字段变化
 * returnFields(config,model,request): 函数，返回字段列表[{name:'',label:'',defaultValue:''}]
 *
 * 特别注意！！！field的上一级必须extensible: true，才能保存未声明的字段
 */

import { defineComponent, onBeforeUnmount, PropType, reactive, watch } from 'vue';

import { DynamicFieldConfig } from '../schema';
import { getConfig } from '../utils/config';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';

export default defineComponent({
  name: 'm-fields-dynamic-field',

  props: {
    ...fieldProps,
    config: {
      type: Object as PropType<DynamicFieldConfig>,
      required: true,
    },
  },

  emits: ['change'],

  setup(props, { emit }) {
    useAddField(props.prop);

    const request = getConfig('request') as Function;
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

    return {
      request,
      fieldMap,
      fieldLabelMap,
      unwatch,

      changeFieldMap,
      inputChangeHandler: (key: string) => {
        emit('change', fieldMap.value[key], key);
      },
    };
  },

  methods: {
    init() {},
  },
});
</script>
