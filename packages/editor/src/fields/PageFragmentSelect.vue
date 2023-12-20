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
      <!-- 编辑按钮 -->
      <Icon v-if="model[name]" class="icon" :icon="Edit" @click="editPageFragment(model[name])"></Icon>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import { Edit } from '@element-plus/icons-vue';

import { FieldProps } from '@tmagic/form';
import { Id, NodeType } from '@tmagic/schema';

import Icon from '@editor/components/Icon.vue';
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
        text: `${item.devconfig?.tabName || item.title || item.name}（${item.id}）`,
        label: `${item.devconfig?.tabName || item.title || item.name}（${item.id}）`,
        value: item.id,
      }));
    }
    return [];
  },
};
const changeHandler = async () => {
  emit('change', props.model[props.name]);
};

const editPageFragment = (id: Id) => {
  services?.editorService.select(id);
};
</script>
