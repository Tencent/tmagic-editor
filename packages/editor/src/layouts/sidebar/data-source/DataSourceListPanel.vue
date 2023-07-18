<template>
  <TMagicScrollbar class="data-source-list-panel m-editor-dep-list-panel">
    <div class="search-wrapper">
      <SearchInput @search="filterTextChangeHandler"></SearchInput>
      <TMagicButton v-if="editable" type="primary" size="small" @click="addHandler">新增</TMagicButton>
    </div>

    <!-- 数据源列表 -->
    <DataSourceList @edit="editHandler" @remove="removeHandler"></DataSourceList>

    <DataSourceConfigPanel
      ref="editDialog"
      :disabled="!editable"
      :values="dataSourceValues"
      :title="typeof dataSourceValues.id !== 'undefined' ? `编辑${dataSourceValues.title}` : '新增'"
      @submit="submitDataSourceHandler"
    ></DataSourceConfigPanel>
  </TMagicScrollbar>
</template>

<script setup lang="ts" name="MEditorDataSourceListPanel">
import { computed, inject, ref } from 'vue';

import { TMagicButton, TMagicScrollbar } from '@tmagic/design';
import type { DataSourceSchema } from '@tmagic/schema';

import SearchInput from '@editor/components/SearchInput.vue';
import type { Services } from '@editor/type';

import DataSourceConfigPanel from './DataSourceConfigPanel.vue';
import DataSourceList from './DataSourceList.vue';

defineOptions({
  name: 'MEditorDataSourceListPanel',
});

const { dataSourceService } = inject<Services>('services') || {};

const editDialog = ref<InstanceType<typeof DataSourceConfigPanel>>();

const dataSourceValues = ref<Record<string, any>>({});

const editable = computed(() => dataSourceService?.get('editable') ?? true);

const addHandler = () => {
  if (!editDialog.value) return;

  dataSourceValues.value = {};

  editDialog.value.show();
};

const editHandler = (id: string) => {
  if (!editDialog.value) return;

  dataSourceValues.value = {
    ...dataSourceService?.getDataSourceById(id),
  };

  editDialog.value.show();
};

const removeHandler = (id: string) => {
  dataSourceService?.remove(id);
};

const submitDataSourceHandler = (value: DataSourceSchema) => {
  if (value.id) {
    dataSourceService?.update(value);
  } else {
    dataSourceService?.add(value);
  }

  editDialog.value?.hide();
};

const dataSourceList = ref<InstanceType<typeof DataSourceList>>();

const filterTextChangeHandler = (val: string) => {
  dataSourceList.value?.filter(val);
};
</script>
