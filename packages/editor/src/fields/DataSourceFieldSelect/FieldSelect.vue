<template>
  <div class="m-editor-data-source-field-select">
    <template v-if="checkStrictly">
      <TMagicSelect
        :model-value="selectDataSourceId"
        clearable
        filterable
        :size="size"
        :disabled="disabled"
        @change="dsChangeHandler"
      >
        <component
          v-for="option in dataSourcesOptions"
          class="tmagic-design-option"
          :key="option.value"
          :is="optionComponent?.component || 'el-option'"
          v-bind="
            optionComponent?.props({
              label: option.text,
              value: option.value,
              disabled: option.disabled,
            }) || {
              label: option.text,
              value: option.value,
              disabled: option.disabled,
            }
          "
        >
        </component>
      </TMagicSelect>

      <TMagicCascader
        :model-value="selectFieldsId"
        clearable
        filterable
        :size="size"
        :disabled="disabled"
        :options="fieldsOptions"
        :props="{
          checkStrictly,
        }"
        @change="fieldChangeHandler"
      ></TMagicCascader>
    </template>

    <TMagicCascader
      v-else
      clearable
      filterable
      :model-value="modelValue"
      :disabled="disabled"
      :size="size"
      :options="cascaderOptions"
      :props="{
        checkStrictly,
      }"
      @change="onChangeHandler"
    ></TMagicCascader>

    <TMagicTooltip v-if="selectDataSourceId && hasDataSourceSidePanel" :content="notEditable ? '查看' : '编辑'">
      <TMagicButton class="m-fields-select-action-button" :size="size" @click="editHandler(selectDataSourceId)"
        ><MIcon :icon="!notEditable ? Edit : View"></MIcon
      ></TMagicButton>
    </TMagicTooltip>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';
import { Edit, View } from '@element-plus/icons-vue';

import {
  getConfig as getDesignConfig,
  TMagicButton,
  TMagicCascader,
  TMagicSelect,
  TMagicTooltip,
} from '@tmagic/design';
import { type FilterFunction, filterFunction, type FormState, type SelectOption } from '@tmagic/form';
import { DataSourceFieldType } from '@tmagic/schema';
import { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX } from '@tmagic/utils';

import MIcon from '@editor/components/Icon.vue';
import { type EventBus, type Services, SideItemKey } from '@editor/type';
import { getCascaderOptionsFromFields, removeDataSourceFieldPrefix } from '@editor/utils';

const props = defineProps<{
  /**
   * 是否要编译成数据源的data。
   * key: 不编译，就是要数据源id和field name;
   * value: 要编译（数据源data[`${filed}`]）
   * */
  value?: 'key' | 'value';
  disabled?: boolean;
  checkStrictly?: boolean;
  size?: 'large' | 'default' | 'small';
  dataSourceFieldType?: DataSourceFieldType[];
  /** 是否可以编辑数据源，disable表示的是是否可以选择数据源 */
  notEditable?: boolean | FilterFunction;
}>();

const emit = defineEmits<{
  change: [v: string[]];
}>();

const modelValue = defineModel<string[] | any>('modelValue', { default: [] });

const optionComponent = getDesignConfig('components')?.option;

const services = inject<Services>('services');
const mForm = inject<FormState | undefined>('mForm');
const eventBus = inject<EventBus>('eventBus');

const dataSources = computed(() => services?.dataSourceService.get('dataSources') || []);

const valueIsKey = computed(() => props.value === 'key');
const notEditable = computed(() => filterFunction(mForm, props.notEditable, props));

const dataSourcesOptions = computed<SelectOption[]>(() =>
  dataSources.value.map((ds) => ({
    text: ds.title || ds.id,
    value: valueIsKey.value ? ds.id : `${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}${ds.id}`,
  })),
);

const selectDataSourceId = ref('');

const selectFieldsId = ref<string[]>([]);

watch(
  modelValue,
  (value) => {
    if (Array.isArray(value)) {
      const [dsId, ...fields] = value;
      selectDataSourceId.value = dsId;
      selectFieldsId.value = fields;
    } else {
      selectDataSourceId.value = '';
      selectFieldsId.value = [];
    }
  },
  {
    immediate: true,
  },
);

const fieldsOptions = computed(() => {
  const ds = dataSources.value.find((ds) => ds.id === removeDataSourceFieldPrefix(selectDataSourceId.value));

  if (!ds) return [];

  return getCascaderOptionsFromFields(ds.fields, props.dataSourceFieldType);
});

const cascaderOptions = computed(() => {
  const options =
    dataSources.value?.map((ds) => ({
      label: ds.title || ds.id,
      value: valueIsKey.value ? ds.id : `${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}${ds.id}`,
      children: getCascaderOptionsFromFields(ds.fields, props.dataSourceFieldType),
    })) || [];
  return options.filter((option) => option.children.length);
});

const dsChangeHandler = (v: string) => {
  modelValue.value = [v];
  emit('change', modelValue.value);
};

const fieldChangeHandler = (v: string[] = []) => {
  modelValue.value = [selectDataSourceId.value, ...v];
  emit('change', modelValue.value);
};

const onChangeHandler = (v: string[] = []) => {
  modelValue.value = v;
  emit('change', v);
};

const hasDataSourceSidePanel = computed(() =>
  (services?.uiService.get('sideBarItems') || []).find((item) => item.$key === SideItemKey.DATA_SOURCE),
);

const editHandler = (id: string) => {
  eventBus?.emit('edit-data-source', removeDataSourceFieldPrefix(id));
};
</script>
