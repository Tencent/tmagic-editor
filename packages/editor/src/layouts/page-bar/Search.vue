<template>
  <div class="m-editor-page-bar-item m-editor-page-bar-item-icon m-editor-page-bar-search">
    <Icon :icon="Search" @click="visible = !visible" :class="{ 'icon-active': visible }"></Icon>
    <Teleport to=".m-editor-page-bar-tabs" v-if="visible">
      <MForm
        v-if="query"
        class="m-editor-page-bar-search-panel"
        :inline="true"
        :config="formConfig"
        :init-values="query"
        :prevent-submit-default="true"
        @change="onFormChange"
      ></MForm>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Search } from '@element-plus/icons-vue';

import { NodeType } from '@tmagic/core';
import { createForm, MForm } from '@tmagic/form';

import Icon from '@editor/components/Icon.vue';

interface Query {
  pageType: NodeType[];
  keyword: string;
}

const emit = defineEmits<{
  search: [value: Query];
}>();

const query = defineModel<Query>('query');

const formConfig = createForm([
  {
    type: 'checkbox-group',
    name: 'pageType',
    options: [
      {
        value: NodeType.PAGE,
        text: '页面',
      },
      {
        value: NodeType.PAGE_FRAGMENT,
        text: '页面片段',
      },
    ],
  },
  {
    name: 'keyword',
    type: 'text',
    placeholder: '请输入关键字',
    clearable: true,
  },
]);

const visible = ref(false);

const onFormChange = (values: Query) => {
  query.value = values;
  emit('search', values);
};
</script>
