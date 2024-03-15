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
    <DataSourceList @edit="editHandler" @remove="removeHandler"></DataSourceList>
  </TMagicScrollbar>

  <DataSourceConfigPanel
    ref="editDialog"
    :disabled="!editable"
    :values="dataSourceValues"
    :title="dialogTitle"
    :slideType="slideType"
    @submit="submitDataSourceHandler"
  ></DataSourceConfigPanel>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { mergeWith } from 'lodash-es';

import { TMagicButton, TMagicPopover, TMagicScrollbar } from '@tmagic/design';
import type { DataSourceSchema } from '@tmagic/schema';

import SearchInput from '@editor/components/SearchInput.vue';
import ToolButton from '@editor/components/ToolButton.vue';
import type { DataSourceListSlots, Services, SlideType } from '@editor/type';

import DataSourceConfigPanel from './DataSourceConfigPanel.vue';
import DataSourceList from './DataSourceList.vue';

defineSlots<DataSourceListSlots>();

defineOptions({
  name: 'MEditorDataSourceListPanel',
});

defineProps<{
  slideType?: SlideType;
}>();

const { dataSourceService } = inject<Services>('services') || {};

const editDialog = ref<InstanceType<typeof DataSourceConfigPanel>>();

const dataSourceValues = ref<Record<string, any>>({});

const dialogTitle = ref('');

const editable = computed(() => dataSourceService?.get('editable') ?? true);
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

const editHandler = (id: string) => {
  if (!editDialog.value) return;

  dataSourceValues.value = {
    ...dataSourceService?.getDataSourceById(id),
  };

  dialogTitle.value = `编辑${dataSourceValues.value.title || ''}`;

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
