<template>
  <div class="m-fields-code-select" :class="config.className">
    <TMagicCard>
      <m-form-container :config="codeConfig" :model="model[name]" @change="changeHandler"> </m-form-container>
    </TMagicCard>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { isEmpty } from 'lodash-es';

import { TMagicCard } from '@tmagic/design';
import { HookType } from '@tmagic/schema';

defineOptions({
  name: 'MEditorCodeSelect',
});

const emit = defineEmits(['change']);

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
  items: [
    {
      type: 'code-select-col',
      labelWidth: 0,
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
