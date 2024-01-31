<template>
  <MForm
    ref="mForm"
    :key="config?.id"
    :id="config?.id"
    :data-magic-id="config?.id"
    :config="formConfig"
    :init-values="values"
  ></MForm>
</template>

<script setup lang="ts">
import { watch } from 'vue';

import { MForm } from '@tmagic/form';

import { AppProps } from './types';
import { useFormConfig } from './useFormConfig';

const props = defineProps<AppProps>();

const { mForm, formConfig, config, values } = useFormConfig(props);

watch(formConfig, async () => {
  setTimeout(() => {
    const page = props.stage.renderer.getDocument()?.querySelector<HTMLElement>('.m-form');
    page && props.stage.renderer.contentWindow?.magic.onPageElUpdate(page);
  });
});
</script>
