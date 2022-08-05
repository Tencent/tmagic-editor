<template>
  <div class="m-cascader" style="width: 100%">
    <el-cascader
      v-model="model[name]"
      ref="cascader"
      style="width: 100%"
      clearable
      filterable
      :size="size"
      :placeholder="config.placeholder"
      :disabled="disabled"
      :options="options"
      :props="{ multiple: config.multiple }"
      @change="changeHandler"
    ></el-cascader>
  </div>
</template>

<script lang="ts">
import {
  ComponentInternalInstance,
  computed,
  defineComponent,
  getCurrentInstance,
  inject,
  PropType,
  ref,
  watchEffect,
} from 'vue';

import { CascaderConfig, FormState } from '../schema';
import { getConfig } from '../utils/config';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';

export default defineComponent({
  name: 'm-fields-cascader',

  props: {
    ...fieldProps,
    config: {
      type: Object as PropType<CascaderConfig>,
      required: true,
    },
  },

  emits: ['change'],

  setup(props, { emit }) {
    const mForm = inject<FormState | null>('mForm');
    const vm = getCurrentInstance() as ComponentInternalInstance;

    useAddField(props.prop);

    const requestFunc = getConfig('request') as Function;

    const cascader = ref<any>();
    const dialog = ref<any>();

    const options = Array.isArray(props.config.options) ? ref(props.config.options) : ref([]);
    const remoteData = ref<any>(null);

    const setRemoteOptions = async function () {
      const { config } = props;
      const { option } = config;
      if (!option) return;
      let { body } = option;

      const postOptions: Record<string, any> = {
        url: option.url,
        cache: option.cache,
        timeout: option.timeout,
        data: {},
      };

      if (body && mForm) {
        if (typeof body === 'function' && props.model && mForm) {
          body = body(mForm, {
            model: props.model,
            formValue: mForm.values,
            formValues: mForm.values,
            config: props.config,
          });
        }
        postOptions.data = body;
      }

      const res = await requestFunc(postOptions);

      remoteData.value = res[option.root];
      if (remoteData.value && typeof option?.item === 'function') {
        options.value = option.item(res[option.root]);
      }
    };

    // 初始化
    if (typeof props.config.options === 'function' && props.model && mForm) {
      watchEffect(
        () =>
          (options.value = (props.config.options as Function)(vm, { model: props.model, formValues: mForm.values })),
      );
    } else if (!props.config.options || !props.config.options.length || props.config.remote) {
      Promise.resolve(setRemoteOptions());
    }

    const action = computed(() => {
      if (props.config.add?.action.method === 'post') {
        return (options: any) =>
          requestFunc({
            ...props.config?.add?.action.body,
            ...options,
          });
      }
      return null;
    });

    return {
      options,
      remoteData,
      addButtonStyle: {
        top: 0,
        left: 0,
        width: 'auto',
      },
      dialogVisible: false,
      cascader,
      dialog,
      action,
      setRemoteOptions,
      changeHandler: (value: any) => {
        if (!cascader.value) return;
        cascader.value.query = '';
        cascader.value.previousQuery = null;
        emit('change', value);
      },
      addHandler: () => {
        if (!dialog.value) return;
        dialog.value.dialogVisible = true;
      },
      editAfterAction: () => {
        setRemoteOptions();
      },
    };
  },
});
</script>
