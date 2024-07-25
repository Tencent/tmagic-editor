<template>
  <div class="m-fields-data-source-select">
    <MSelect
      :model="model"
      :name="name"
      :size="size"
      :prop="prop"
      :disabled="disabled"
      :config="selectConfig"
      :last-values="lastValues"
      @change="changeHandler"
    ></MSelect>

    <TMagicTooltip v-if="model[name] && hasDataSourceSidePanel" :content="notEditable ? '查看' : '编辑'">
      <TMagicButton class="m-fields-select-action-button" :size="size" @click="editHandler"
        ><MIcon :icon="!notEditable ? Edit : View"></MIcon
      ></TMagicButton>
    </TMagicTooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { Edit, View } from '@element-plus/icons-vue';

import { TMagicButton, TMagicTooltip } from '@tmagic/design';
import { type FieldProps, filterFunction, type FormState, MSelect, type SelectConfig } from '@tmagic/form';

import MIcon from '@editor/components/Icon.vue';
import type { DataSourceSelect, EventBus, Services } from '@editor/type';
import { SideItemKey } from '@editor/type';

defineOptions({
  name: 'MFieldsDataSourceSelect',
});

const emit = defineEmits(['change']);

const props = withDefaults(defineProps<FieldProps<DataSourceSelect>>(), {
  disabled: false,
});

const mForm = inject<FormState | undefined>('mForm');
const { dataSourceService, uiService } = inject<Services>('services') || {};
const eventBus = inject<EventBus>('eventBus');

const dataSources = computed(() => dataSourceService?.get('dataSources') || []);

const notEditable = computed(() => filterFunction(mForm, props.config.notEditable, props));

const hasDataSourceSidePanel = computed(() =>
  (uiService?.get('sideBarItems') || []).find((item) => item.$key === SideItemKey.DATA_SOURCE),
);

const selectConfig = computed<SelectConfig>(() => {
  const { type, dataSourceType, value, ...config } = props.config;

  const valueIsId = props.config.value === 'id';

  return {
    ...config,
    type: 'select',
    valueKey: 'dataSourceId',
    options: dataSources.value
      .filter((ds) => !props.config.dataSourceType || ds.type === props.config.dataSourceType)
      .map((ds) => ({
        value: valueIsId
          ? ds.id
          : {
              isBindDataSource: true,
              dataSourceType: ds.type,
              dataSourceId: ds.id,
            },
        text: ds.title || ds.id,
      })),
  };
});

const changeHandler = (value: any) => {
  emit('change', value);
};

const editHandler = () => {
  const value = props.model[props.name];

  if (!value) return;

  const id = typeof value === 'string' ? value : value.dataSourceId;

  const dataSource = dataSourceService?.getDataSourceById(id);

  if (!dataSource) return;

  eventBus?.emit('edit-data-source', id);
};
</script>
