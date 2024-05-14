<template>
  <div class="m-fields-data-source-field-select">
    <component
      :is="tagName"
      :config="showDataSourceFieldSelect || !config.fieldConfig ? cascaderConfig : config.fieldConfig"
      :model="model"
      :name="name"
      :disabled="disabled"
      :size="size"
      :last-values="lastValues"
      :init-values="initValues"
      :values="values"
      :prop="`${prop}${prop ? '.' : ''}${name}`"
      @change="onChangeHandler"
    ></component>

    <TMagicButton
      v-if="(showDataSourceFieldSelect || !config.fieldConfig) && selectedDataSourceId && hasDataSourceSidePanel"
      class="m-fields-select-action-button"
      :size="size"
      @click="editHandler(selectedDataSourceId)"
      ><MIcon :icon="!notEditable ? Edit : View"></MIcon
    ></TMagicButton>

    <TMagicButton
      v-if="config.fieldConfig"
      style="margin-left: 5px"
      :type="showDataSourceFieldSelect ? 'primary' : 'default'"
      :size="size"
      @click="showDataSourceFieldSelect = !showDataSourceFieldSelect"
      ><MIcon :icon="Coin"></MIcon
    ></TMagicButton>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, resolveComponent, watch } from 'vue';
import { Coin, Edit, View } from '@element-plus/icons-vue';

import { TMagicButton } from '@tmagic/design';
import type { CascaderConfig, FieldProps, FormState } from '@tmagic/form';
import { filterFunction, MCascader } from '@tmagic/form';
import { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX } from '@tmagic/utils';

import MIcon from '@editor/components/Icon.vue';
import type { DataSourceFieldSelectConfig, EventBus, Services } from '@editor/type';
import { SideItemKey } from '@editor/type';
import { getCascaderOptionsFromFields } from '@editor/utils';

defineOptions({
  name: 'MFieldsDataSourceFieldSelect',
});

const services = inject<Services>('services');
const eventBus = inject<EventBus>('eventBus');
const emit = defineEmits(['change']);

const props = withDefaults(defineProps<FieldProps<DataSourceFieldSelectConfig>>(), {
  disabled: false,
});

const notEditable = computed(() => filterFunction(mForm, props.config.notEditable, props));

const hasDataSourceSidePanel = computed(() =>
  (services?.uiService.get('sideBarItems') || []).find((item) => item.$key === SideItemKey.DATA_SOURCE),
);

const selectedDataSourceId = computed(() => {
  const value = props.model[props.name];
  if (!Array.isArray(value) || !value.length) {
    return '';
  }

  return value[0].replace(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX, '');
});

const dataSources = computed(() => services?.dataSourceService.get('dataSources'));

const cascaderConfig = computed<CascaderConfig>(() => {
  const valueIsKey = props.config.value === 'key';

  return {
    type: 'cascader',
    checkStrictly: props.config.checkStrictly ?? !valueIsKey,
    popperClass: 'm-editor-data-source-field-select-popper',
    options: () => {
      const options =
        dataSources.value?.map((ds) => ({
          label: ds.title || ds.id,
          value: valueIsKey ? ds.id : `${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}${ds.id}`,
          children: getCascaderOptionsFromFields(ds.fields, props.config.dataSourceFieldType),
        })) || [];
      return options.filter((option) => option.children.length);
    },
  };
});

const showDataSourceFieldSelect = ref(false);

watch(
  () => props.model[props.name],
  (value) => {
    if (
      Array.isArray(value) &&
      typeof value[0] === 'string' &&
      value[0].startsWith(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX)
    ) {
      showDataSourceFieldSelect.value = true;
    } else {
      showDataSourceFieldSelect.value = false;
    }
  },
  {
    immediate: true,
  },
);

const mForm = inject<FormState | undefined>('mForm');

const type = computed((): string => {
  let type = props.config.fieldConfig?.type;
  if (typeof type === 'function') {
    type = type(mForm, {
      model: props.model,
    });
  }
  if (type === 'form') return '';
  if (type === 'container') return '';
  return type?.replace(/([A-Z])/g, '-$1').toLowerCase() || (props.config.items ? '' : 'text');
});

const tagName = computed(() => {
  if (showDataSourceFieldSelect.value || !props.config.fieldConfig) {
    return MCascader;
  }

  const component = resolveComponent(`m-${props.config.items ? 'form' : 'fields'}-${type.value}`);
  if (typeof component !== 'string') return component;
  return 'm-fields-text';
});

const onChangeHandler = (value: any) => {
  emit('change', value);
};

const editHandler = (id: string) => {
  eventBus?.emit('edit-data-source', id);
};
</script>
