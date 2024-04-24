<template>
  <TMagicScrollbar class="data-source-list-panel m-editor-layer-panel">
    <div class="search-wrapper">
      <SearchInput @search="filterTextChangeHandler"></SearchInput>
      <TMagicPopover v-if="editable" placement="right">
        <template #reference>
          <TMagicButton type="primary" size="small">新增</TMagicButton>
        </template>
        <div class="data-source-list-panel-add-menu">
          <ToolButton
            v-for="(item, index) in datasourceTypeList"
            :data="{
              type: 'button',
              text: item.text,
              handler: () => {
                addHandler(item.type);
              },
            }"
            :key="index"
          ></ToolButton>
        </div>
      </TMagicPopover>

      <slot name="data-source-panel-search"></slot>
    </div>

    <!-- 数据源列表 -->
    <DataSourceList ref="dataSourceList" @edit="editHandler" @remove="removeHandler"></DataSourceList>
  </TMagicScrollbar>

  <DataSourceConfigPanel
    ref="editDialog"
    :disabled="!editable"
    :values="dataSourceValues"
    :title="dialogTitle"
    @submit="submitDataSourceHandler"
  ></DataSourceConfigPanel>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { mergeWith } from 'lodash-es';

import { TMagicButton, TMagicPopover, TMagicScrollbar } from '@tmagic/design';

import SearchInput from '@editor/components/SearchInput.vue';
import ToolButton from '@editor/components/ToolButton.vue';
import { useDataSourceEdit } from '@editor/hooks/use-data-source-edit';
import type { DataSourceListSlots, EventBus, Services } from '@editor/type';

import DataSourceConfigPanel from './DataSourceConfigPanel.vue';
import DataSourceList from './DataSourceList.vue';

defineSlots<DataSourceListSlots>();

defineOptions({
  name: 'MEditorDataSourceListPanel',
});

const eventBus = inject<EventBus>('eventBus');
const { dataSourceService } = inject<Services>('services') || {};

const { editDialog, dataSourceValues, dialogTitle, editable, editHandler, submitDataSourceHandler } =
  useDataSourceEdit(dataSourceService);

const datasourceTypeList = computed(() =>
  [
    { text: '基础', type: 'base' },
    { text: 'HTTP', type: 'http' },
  ].concat(dataSourceService?.get('datasourceTypeList') ?? []),
);

const addHandler = (type: string) => {
  if (!editDialog.value) return;

  const datasourceType = datasourceTypeList.value.find((item) => item.type === type);

  dataSourceValues.value = mergeWith(
    { type, title: datasourceType?.text },
    dataSourceService?.getFormValue(type) || {},
    (objValue, srcValue) => {
      if (Array.isArray(srcValue)) {
        return srcValue;
      }
    },
  );

  dialogTitle.value = `新增${datasourceType?.text || ''}`;

  editDialog.value.show();
};

const removeHandler = (id: string) => {
  dataSourceService?.remove(id);
};

const dataSourceList = ref<InstanceType<typeof DataSourceList>>();

const filterTextChangeHandler = (val: string) => {
  dataSourceList.value?.filter(val);
};

eventBus?.on('edit-data-source', (id: string) => {
  editHandler(id);
});
</script>
