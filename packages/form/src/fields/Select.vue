<template>
  <el-select
    v-if="model"
    v-model="model[name]"
    v-loading="loading"
    class="m-select"
    ref="select"
    clearable
    filterable
    :popper-class="`m-select-popper ${popperClass}`"
    :size="size"
    :remote="remote"
    :placeholder="config.placeholder"
    :multiple="config.multiple"
    :value-key="config.valueKey || 'value'"
    :allow-create="config.allowCreate"
    :disabled="disabled"
    :remote-method="config.remote && remoteMethod"
    @change="changeHandler"
    @visible-change="visibleHandler"
  >
    <template v-if="config.group"><select-option-groups :options="groupOptions"></select-option-groups></template>
    <template v-else><select-options :options="options"></select-options></template>
    <div v-loading="true" v-if="moreLoadingVisible"></div>
  </el-select>
</template>

<script lang="ts">
import { defineComponent, inject, onBeforeMount, onMounted, PropType, Ref, ref, watch } from 'vue';

import { FormState, SelectConfig, SelectGroupOption, SelectOption } from '../schema';
import { getConfig } from '../utils/config';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';

import SelectOptionGroups from './SelectOptionGroups.vue';
import SelectOptions from './SelectOptions.vue';

export default defineComponent({
  name: 'm-fields-select',

  components: { SelectOptions, SelectOptionGroups },

  props: {
    ...fieldProps,
    config: {
      type: Object as PropType<SelectConfig>,
      required: true,
    },
  },

  emits: ['change'],

  setup(props, { emit }) {
    if (!props.model) throw new Error('不能没有model');
    useAddField(props.prop);

    const select = ref<any>();
    const mForm = inject<FormState | undefined>('mForm');
    const options = ref<SelectOption[] | SelectGroupOption[]>([]);
    const localOptions = ref<SelectOption[] | SelectGroupOption[]>([]);
    const loading = ref(false);
    const moreLoadingVisible = ref(false);
    const total = ref(0);
    const pgIndex = ref(0);
    const pgSize = ref(20);
    const query = ref('');
    const remoteData = ref<any[]>([]);
    const remote = ref(true);

    const equalValue = (value: any, v: any): boolean => {
      if (typeof v === 'object') {
        const key = props.config.valueKey || 'value';
        return v[key] === value[key];
      }

      return value === v;
    };

    const mapOptions = (data: any[]) => {
      const { option } = props.config;
      const { text } = option;
      const { value } = option;

      return data.map((item) => ({
        text: typeof text === 'function' ? text(item) : item[text || 'text'],
        value: typeof value === 'function' ? value(item) : item[value || 'value'],
      }));
    };

    const getOptions = async () => {
      if (!props.model) return [];

      if (localOptions.value.length) {
        return localOptions.value;
      }

      loading.value = true;

      let items: SelectOption[] | SelectGroupOption[] = [];

      const { config } = props;
      const { option } = config;
      let { body } = option;

      let postOptions: Record<string, any> = {
        method: option.method || 'POST',
        url: option.url,
        cache: option.cache,
        timeout: option.timeout,
        mode: option.mode,
        headers: option.headers || {},
        json: option.json || false,
      };

      if (body) {
        if (typeof body === 'function') {
          body = body(mForm, {
            model: props.model,
            formValue: mForm?.values,
            formValues: mForm?.values,
            config: props.config,
          }) as Record<string, any>;
        }

        body.query = query.value;
        body.pgSize = pgSize.value;
        body.pgIndex = pgIndex.value;
        postOptions.data = body;
      }

      const requestFuc = getConfig('request') as Function;

      if (typeof option.beforeRequest === 'function') {
        postOptions = option.beforeRequest(mForm, postOptions, {
          model: props.model,
          formValue: mForm?.values,
        });
      }

      if (option.method?.toLocaleLowerCase() === 'jsonp') {
        postOptions.jsonpCallback = option.jsonpCallback || 'callback';
      }

      let res = await requestFuc(postOptions);

      if (typeof option.afterRequest === 'function') {
        res = option.afterRequest(mForm, res, {
          model: props.model,
          formValue: mForm?.values,
          formValues: mForm?.values,
          config: props.config,
        });
      }

      const optionsData = res[option.root];

      if (res.total > 0) {
        total.value = res.total;
      }

      remoteData.value = remoteData.value.concat(optionsData);
      if (optionsData) {
        if (typeof option.item === 'function') {
          items = option.item(optionsData);
        } else if (optionsData.map) {
          items = mapOptions(optionsData);
        }
      }

      loading.value = false;

      // 多选过滤时会导致已选的选项显示不了，所以要把已选的选项保留不要过滤没了
      const selectedOptions: SelectOption[] | SelectGroupOption[] = [];
      if (props.config.multiple && props.model[props.name]) {
        options.value.forEach((o: any) => {
          const isInclude = props.model?.[props.name].includes(o.value);
          if (isInclude && !(items as any[]).find((op: any) => op.value === o.value)) {
            selectedOptions.push(o);
          }
        });
      }

      return pgIndex.value === 0 ? (selectedOptions as any[]).concat(items) : (options.value as any).concat(items);
    };

    const getInitLocalOption = async () => {
      if (!props.model) return [];

      const value = props.model[props.name];
      const { config } = props;
      localOptions.value = await getOptions();

      remote.value = false;

      if (config.group) {
        if (config.multiple && value.findIndex) {
          return (localOptions.value as SelectGroupOption[]).filter(
            (group) => group.options.findIndex((item) => value.find((v: any) => equalValue(item.value, v)) > -1) > -1,
          );
        }

        return (localOptions.value as SelectGroupOption[]).filter(
          (group) => group.options.findIndex((item) => equalValue(item.value, value)) > -1,
        );
      }

      if (config.multiple && value.findIndex) {
        return (localOptions.value as any[]).filter(
          (item) => value.findIndex((v: any) => equalValue(item.value, v)) > -1,
        );
      }
      return (localOptions.value as any[]).filter((item) => equalValue(item.value, value));
    };

    const getInitOption = async () => {
      if (!props.model) return [];

      const { config } = props;
      const { option } = config;

      let options: SelectOption[] | SelectGroupOption[] = [];

      let url = option.initUrl;
      if (!url) {
        return getInitLocalOption();
      }

      if (typeof url === 'function') {
        url = await url(mForm, { model: props.model, formValue: mForm?.values });
      }

      const postOptions: Record<string, any> = {
        method: option.method || 'POST',
        url,
        data: {
          id: props.model[props.name],
        },
        mode: option.mode,
        headers: option.headers || {},
        json: option.json || false,
      };
      if (option.method?.toLocaleLowerCase() === 'jsonp') {
        postOptions.jsonpCallback = option.jsonpCallback || 'callback';
      }

      const requestFuc = getConfig('request') as Function;
      const res = await requestFuc(postOptions);

      let initData = res[option.root];
      if (initData) {
        if (!Array.isArray(initData)) {
          initData = [initData];
        }

        if (typeof option.item === 'function') {
          options = option.item(initData);
        } else if (initData.map) {
          options = mapOptions(initData);
        }
      }

      return options;
    };

    if (typeof props.config.options === 'function') {
      watch(
        () => mForm?.values,
        () => {
          typeof props.config.options === 'function' &&
            Promise.resolve(
              props.config.options(mForm, {
                model: props.model,
                prop: props.prop,
                formValues: mForm?.values,
                formValue: mForm?.values,
                config: props.config,
              }),
            ).then((data) => {
              options.value = data;
            });
        },
        {
          deep: true,
          immediate: true,
        },
      );
    } else if (Array.isArray(props.config.options)) {
      watch(
        () => props.config.options,
        () => {
          options.value = props.config.options as SelectOption[] | SelectGroupOption[];
        },
        { immediate: true },
      );
    } else if (props.config.option) {
      onBeforeMount(() => {
        if (!props.model) return;
        const v = props.model[props.name];
        if (Array.isArray(v) ? v.length : v) {
          getInitOption().then((data) => {
            options.value = data;
          });
        }
      });
    }

    props.config.remote &&
      onMounted(() => {
        select.value?.scrollbar.wrap$.addEventListener('scroll', async (e: Event) => {
          const el = e.currentTarget as HTMLDivElement;
          if (moreLoadingVisible.value) {
            return;
          }
          if (el.scrollHeight - el.clientHeight - el.scrollTop > 1) {
            return;
          }
          if (total.value <= options.value.length) {
            return;
          }
          moreLoadingVisible.value = true;
          pgIndex.value += 1;
          options.value = await getOptions();
          moreLoadingVisible.value = false;
        });
      });

    return {
      select,
      loading,
      remote,
      options: options as Ref<SelectOption[]>,
      groupOptions: options as Ref<SelectGroupOption[]>,
      moreLoadingVisible,
      popperClass: mForm?.popperClass,

      getOptions,

      getRequestFuc() {
        return getConfig('request');
      },

      changeHandler(value: any) {
        emit('change', value);
      },

      async visibleHandler(visible: boolean) {
        if (!visible) return;

        if (!props.config.remote) return;
        if (query.value && select.value) {
          select.value.query = query.value;
          select.value.previousQuery = query.value;
          select.value.selectedLabel = query.value;
        } else if (options.value.length <= (props.config.multiple ? props.model?.[props.name].length : 1)) {
          options.value = await getOptions();
        }
      },

      async remoteMethod(q: string) {
        if (!localOptions.value.length) {
          query.value = q;
          pgIndex.value = 0;
          options.value = await getOptions();
          // 多选时如果过滤选项会导致已选好的标签异常，需要重新刷新一下el-select的状态
          if (props.config.multiple)
            setTimeout(() => {
              select.value?.setSelected();
            }, 0);
        }
      },
    };
  },
});
</script>
