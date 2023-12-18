<template>
  <div class="m-fields-page-fragment-select">
    <div class="page-fragment-select-container">
      <!-- 页面片下拉框 -->
      <m-form-container
        class="select"
        :config="selectConfig"
        :model="model"
        :size="size"
        @change="changeHandler"
      ></m-form-container>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';

import { FieldProps } from '@tmagic/form';
import { NodeType } from '@tmagic/schema';

import type { PageFragmentSelectConfig, Services } from '@editor/type';

defineOptions({
  name: 'MEditorPageFragmentSelect',
});

const services = inject<Services>('services');
const emit = defineEmits(['change']);

const props = withDefaults(defineProps<FieldProps<PageFragmentSelectConfig>>(), {
  disabled: false,
});
const pageList = computed(() =>
  services?.editorService.get('root')?.items.filter((item) => item.type === NodeType.PAGE_FRAGMENT),
);

const selectConfig = {
  type: 'select',
  name: props.name,
  options: () => {
    if (pageList.value) {
      return pageList.value.map((item) => ({
        text: `${item.name}（${item.id}）`,
        label: `${item.name}（${item.id}）`,
        value: item.id,
      }));
    }
    return [];
  },
};
const changeHandler = async () => {
  emit('change', props.model[props.name]);
};
</script>
