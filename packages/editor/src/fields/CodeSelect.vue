<template>
  <div class="m-fields-code-select" :class="config.className">
    <TMagicCard>
      <m-form-container :config="codeConfig" :model="model[name]" @change="changeHandler"> </m-form-container>
    </TMagicCard>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, watch } from 'vue';
import { isEmpty } from 'lodash-es';

import { TMagicCard } from '@tmagic/design';
import { HookType } from '@tmagic/schema';

import type { Services } from '@editor/type';

defineOptions({
  name: 'MEditorCodeSelect',
});

const emit = defineEmits(['change']);

const services = inject<Services>('services');

const props = withDefaults(
  defineProps<{
    config: {
      className?: string;
    };
    model: any;
    prop: string;
    name: string;
    size: 'small' | 'default' | 'large';
  }>(),
  {},
);

const codeConfig = computed(() => ({
  type: 'group-list',
  name: 'hookData',
  enableToggleMode: false,
  expandAll: true,
  titleKey: 'codeId',
  items: [
    {
      type: 'code-select-col',
      name: 'codeId',
      labelWidth: 0,
      disabled: () => !services?.codeBlockService.getEditStatus(),
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
