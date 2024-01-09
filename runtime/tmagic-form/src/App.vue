<template>
  <MForm ref="mForm" :id="config?.id" :data-magic-id="config?.id" :config="formConfig" :init-values="values"></MForm>
</template>

<script setup lang="ts">
import { watch } from 'vue';

import { MForm } from '@tmagic/form';
import type StageCore from '@tmagic/stage';

import { useFormConfig } from './useFormConfig';

const props = defineProps<{
  stage: StageCore;
}>();

const { mForm, formConfig, config, values } = useFormConfig(props.stage.renderer.contentWindow);

watch(formConfig, async () => {
  setTimeout(() => {
    const page = props.stage.renderer.getDocument()?.querySelector<HTMLElement>('.m-form');
    page && props.stage.renderer.contentWindow?.magic.onPageElUpdate(page);
  });
});
</script>
