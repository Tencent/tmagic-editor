<template>
  <div class="m-fields-page-fragment-select">
    <div class="page-fragment-select-container">
      <!-- 页面片下拉框 -->
      <MSelect
        class="select"
        :config="selectConfig"
        :model="model"
        :name="name"
        :size="size"
        :prop="prop"
        :disabled="disabled"
        @change="changeHandler"
      ></MSelect>
      <!-- 编辑按钮 -->
      <Icon v-if="model[name]" class="icon" :icon="Edit" @click="editPageFragment(model[name])"></Icon>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Edit } from '@element-plus/icons-vue';

import { Id, NodeType } from '@tmagic/core';
import { FieldProps, MSelect, type PageFragmentSelectConfig, type SelectConfig } from '@tmagic/form';

import Icon from '@editor/components/Icon.vue';
import { useServices } from '@editor/hooks/use-services';

defineOptions({
  name: 'MFieldsPageFragmentSelect',
});

const { editorService } = useServices();
const emit = defineEmits(['change']);

withDefaults(defineProps<FieldProps<PageFragmentSelectConfig>>(), {
  disabled: false,
});

const pageList = computed(() =>
  editorService.get('root')?.items.filter((item) => item.type === NodeType.PAGE_FRAGMENT),
);

const selectConfig: SelectConfig = {
  type: 'select',
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
const changeHandler = (v: Id) => {
  emit('change', v);
};

const editPageFragment = (id: Id) => {
  editorService.select(id);
};
</script>
