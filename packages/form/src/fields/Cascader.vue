<template>
  <TMagicCascader
    v-model="model[name]"
    ref="tMagicCascader"
    style="width: 100%"
    clearable
    filterable
    :size="size"
    :placeholder="config.placeholder"
    :disabled="disabled"
    :options="options"
    :popper-class="config.popperClass"
    :props="{
      multiple: config.multiple ?? false,
      emitPath: config.emitPath ?? true,
      checkStrictly: config.checkStrictly ?? false,
    }"
    @change="changeHandler"
  ></TMagicCascader>
</template>

<script setup lang="ts">
import { inject, ref, watchEffect } from 'vue';

import { TMagicCascader } from '@tmagic/design';

import type { CascaderConfig, CascaderOption, FieldProps, FormState } from '../schema';
import { getConfig } from '../utils/config';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormCascader',
});

const props = defineProps<FieldProps<CascaderConfig>>();

const emit = defineEmits(['change']);

const mForm = inject<FormState | null>('mForm');

useAddField(props.prop);

const requestFunc = getConfig('request') as Function;

const tMagicCascader = ref<InstanceType<typeof TMagicCascader>>();

const options = ref<CascaderOption[]>([]);
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
    () => (options.value = (props.config.options as Function)(mForm, { model: props.model, formValues: mForm.values })),
  );
} else if (!props.config.options?.length || props.config.remote) {
  Promise.resolve(setRemoteOptions());
} else if (Array.isArray(props.config.options)) {
  watchEffect(() => {
    options.value = props.config.options as CascaderOption[];
  });
}

const changeHandler = (value: any) => {
  if (!tMagicCascader.value) return;
  tMagicCascader.value.setQuery('');
  tMagicCascader.value.setPreviousQuery(null);
  emit('change', value);
};
</script>
