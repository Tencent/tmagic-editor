<template>
  <el-tabs
    v-model="activeTabName"
    :class="config.dynamic ? 'magic-form-dynamic-tab' : 'magic-form-tab'"
    :type="config.tabType"
    :editable="config.editable || false"
    :tab-position="config.tabPosition || 'top'"
    @tab-click="tabClickHandler"
    @tab-add="onTabAdd"
    @tab-remove="onTabRemove"
  >
    <template v-for="(tab, tabIndex) in tabs">
      <el-tab-pane
        v-if="display(tab.display) && tabItems(tab).length"
        :key="tab[mForm?.keyProp || '__key'] ?? tabIndex"
        :name="filter(tab.status) || tabIndex.toString()"
        :label="filter(tab.title)"
        :lazy="tab.lazy || false"
      >
        <m-form-container
          v-for="item in tabItems(tab)"
          :key="item[mForm?.keyProp || '__key']"
          :config="item"
          :model="
            config.dynamic
              ? (name ? model[name] : model)[tabIndex]
              : tab.name
              ? (name ? model[name] : model)[tab.name]
              : name
              ? model[name]
              : model
          "
          :prop="config.dynamic ? `${prop}${prop ? '.' : ''}${String(tabIndex)}` : prop"
          :size="size"
          :label-width="tab.labelWidth || labelWidth"
          :expand-more="expandMore"
          @change="changeHandler"
        ></m-form-container>
      </el-tab-pane>
    </template>
  </el-tabs>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, ref, watchEffect } from 'vue';
import { cloneDeep } from 'lodash-es';

import { FormState, FormValue, TabConfig, TabPaneConfig } from '../schema';
import { display, filterFunction } from '../utils/form';

const getActive = (mForm: FormState | undefined, props: any, activeTabName: string) => {
  const { config, model, prop } = props;
  const { active } = config;

  if (typeof active === 'function') return active(mForm, { model, formValue: mForm?.values, prop });
  if (+activeTabName >= props.config.items.length) return '0';
  if (typeof active !== 'undefined') return active;

  return '0';
};

const tabClickHandler = (mForm: FormState | undefined, tab: any, props: any) => {
  const { config, model, prop } = props;

  // 兼容vue2的element-ui
  tab.name = tab.paneName;

  if (typeof config.onTabClick === 'function') {
    config.onTabClick(mForm, tab, { model, formValue: mForm?.values, prop, config });
  }

  const tabConfig = config.items.find((item: TabPaneConfig) => tab.name === item.status);
  if (tabConfig && typeof tabConfig.onTabClick === 'function') {
    tabConfig.onTabClick(mForm, tab, { model, formValue: mForm?.values, prop, config });
  }
};

const Tab = defineComponent({
  name: 'm-form-tab',

  props: {
    labelWidth: String,
    expandMore: Boolean,

    model: {
      type: Object,
      default: () => ({}),
    },

    config: {
      type: Object as PropType<TabConfig>,
      default: () => ({}),
    },

    prop: String,

    name: String,

    size: String,
  },

  emits: {
    change(values: FormValue) {
      return values;
    },
  },

  setup(props, { emit }) {
    const mForm = inject<FormState | undefined>('mForm');
    const activeTabName = ref(getActive(mForm, props, ''));

    const tabs = computed(() => {
      if (props.config.dynamic) {
        if (!props.config.name) throw new Error('dynamic tab 必须配置name');
        return props.model[props.config.name] || [];
      }
      return props.config.items;
    });

    const filter = (config: any) => filterFunction(mForm, config, props);

    watchEffect(() => {
      if (typeof props.config.activeChange === 'function') {
        props.config.activeChange(mForm, activeTabName.value, {
          model: props.model,
          prop: props.prop,
        });
      }
    });

    return {
      mForm,

      activeTabName,

      tabs,

      filter,

      tabItems: (tab: TabPaneConfig) => (props.config.dynamic ? props.config.items : tab.items),

      tabClickHandler: (tab: any) => tabClickHandler(mForm, tab, props),

      onTabAdd: () => {
        if (!props.config.name) throw new Error('dynamic tab 必须配置name');

        if (typeof props.config.onTabAdd === 'function') {
          props.config.onTabAdd(mForm, {
            model: props.model,
            prop: props.prop,
            config: props.config,
          });
        } else if (tabs.value.length > 0) {
          const newObj = cloneDeep(tabs.value[0]);
          newObj.title = `标签${tabs.value.length + 1}`;
          props.model[props.config.name].push(newObj);
        }
        emit('change', props.model);
        mForm?.$emit('field-change', props.prop, props.model[props.config.name]);
      },

      onTabRemove: (tabName: string) => {
        if (!props.config.name) throw new Error('dynamic tab 必须配置name');

        if (typeof props.config.onTabRemove === 'function') {
          props.config.onTabRemove(mForm, tabName, {
            model: props.model,
            prop: props.prop,
            config: props.config,
          });
        } else {
          props.model[props.config.name].splice(+tabName, 1);

          // 防止删除后没有选中的问题
          if (tabName < activeTabName.value || activeTabName.value >= props.model[props.config.name].length) {
            activeTabName.value = (+activeTabName.value - 1).toString();
            tabClickHandler(mForm, { name: activeTabName.value }, props);
          }
        }
        emit('change', props.model);
        mForm?.$emit('field-change', props.prop, props.model[props.config.name]);
      },

      display: (displayConfig: any) => display(mForm, displayConfig, props),

      changeHandler: () => {
        emit('change', props.model);
        if (typeof props.config.onChange === 'function') {
          props.config.onChange(mForm, { model: props.model, prop: props.prop, config: props.config });
        }
      },
    };
  },
});

export default Tab;
</script>
