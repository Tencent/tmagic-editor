<template>
  <TMagicForm
    class="m-form"
    ref="tMagicForm"
    :model="values"
    :label-width="labelWidth"
    :style="`height: ${height}`"
    :inline="inline"
    :label-position="labelPosition"
    @submit="submitHandler"
  >
    <template v-if="initialized && Array.isArray(config)">
      <Container
        v-for="(item, index) in config"
        :disabled="disabled"
        :key="(item as Record<string, any>)[keyProp] ?? index"
        :config="item"
        :model="values"
        :last-values="lastValuesProcessed"
        :is-compare="isCompare"
        :label-width="item.labelWidth || labelWidth"
        :step-active="stepActive"
        :size="size"
        @change="changeHandler"
      ></Container>
    </template>
  </TMagicForm>
</template>

<script setup lang="ts">
import { provide, reactive, ref, shallowRef, toRaw, useTemplateRef, watch, watchEffect } from 'vue';
import { cloneDeep, isEqual } from 'lodash-es';

import { TMagicForm, tMagicMessage, tMagicMessageBox } from '@tmagic/design';
import { setValueByKeyPath } from '@tmagic/utils';

import Container from './containers/Container.vue';
import { getConfig } from './utils/config';
import { initValue } from './utils/form';
import type { ChangeRecord, ContainerChangeEventData, FormConfig, FormState, FormValue, ValidateError } from './schema';

defineOptions({
  name: 'MForm',
});

const props = withDefaults(
  defineProps<{
    /** 表单配置 */
    config: FormConfig;
    /** 表单值 */
    initValues: Record<string, any>;
    /** 需对比的值（开启对比模式时传入） */
    lastValues?: Record<string, any>;
    /** 是否开启对比模式 */
    isCompare?: boolean;
    parentValues?: Record<string, any>;
    labelWidth?: string;
    disabled?: boolean;
    height?: string;
    stepActive?: string | number;
    size?: 'small' | 'default' | 'large';
    inline?: boolean;
    labelPosition?: string;
    keyProp?: string;
    popperClass?: string;
    preventSubmitDefault?: boolean;
    extendState?: (_state: FormState) => Record<string, any> | Promise<Record<string, any>>;
  }>(),
  {
    config: () => [],
    initValues: () => ({}),
    lastValues: () => ({}),
    isCompare: false,
    parentValues: () => ({}),
    labelWidth: '200px',
    disabled: false,
    height: 'auto',
    stepActive: 1,
    inline: false,
    labelPosition: 'right',
    keyProp: '__key',
  },
);

const emit = defineEmits(['change', 'error', 'field-input', 'field-change', 'update:stepActive']);

const tMagicFormRef = useTemplateRef('tMagicForm');
const initialized = ref(false);
const values = ref<FormValue>({});
const lastValuesProcessed = ref<FormValue>({});
const fields = new Map<string, any>();

const requestFuc = getConfig('request') as Function;

/**
 * formState 实现说明：
 *
 * 1. 与 props 直接对应的字段（config / initValues / lastValues / isCompare / parentValues /
 *    keyProp / popperClass）使用「访问器（getter）」定义，每次读取都会回到 `props.xxx`
 *    取最新值，不存在「props 变了但 formState 还没同步过来」的中间态。
 *
 * 2. `values` / `lastValuesProcessed` 是 ref，Vue 的 `reactive` 会自动解包，因此每次
 *    访问 `formState.values` / `formState.lastValuesProcessed` 也都是当前 ref 值。
 *
 * 3. `extendState` 注入的字段在下方的 `watchEffect` 中合并到 `formState`：
 *    - data 描述符（普通字段）通过 `formState[key] = value` 写入，走 reactive proxy 的
 *      set，触发依赖通知；`extendState` 同步段读到的响应式数据变化时会自动重跑，
 *      把最新值刷进 formState。
 *    - accessor 描述符（`{ get stage() { return ... } }`）按原样写入，调用方可以控制
 *      读时求值，每次读取都会重新执行 getter。
 */
const formState: FormState = reactive<FormState>({
  get keyProp() {
    return props.keyProp;
  },
  get popperClass() {
    return props.popperClass;
  },
  get config() {
    return props.config;
  },
  get initValues() {
    return props.initValues;
  },
  get isCompare() {
    return props.isCompare;
  },
  get lastValues() {
    return props.lastValues;
  },
  get parentValues() {
    return props.parentValues;
  },
  values,
  lastValuesProcessed,
  $emit: emit as (_event: string, ..._args: any[]) => void,
  fields,
  setField: (prop: string, field: any) => fields.set(prop, field),
  getField: (prop: string) => fields.get(prop),
  deleteField: (prop: string) => fields.delete(prop),
  $messageBox: tMagicMessageBox,
  $message: tMagicMessage,
  post: (options: any) => {
    if (requestFuc) {
      return requestFuc({
        method: 'POST',
        ...options,
      });
    }
  },
});

/**
 * `extendState` 的同步段（直到第一个 `await` 之前）所访问的任何响应式数据，
 * 都会被 `watchEffect` 自动跟踪。这样可以兼容历史用法 ——
 *
 *   extendState: (formState) => ({
 *     username: store.username,   // 同步读 store，会被跟踪
 *     env: store.env,
 *   })
 *
 * 当 `store.username` 变化时，整个 effect 重跑，新值会被刷进 `formState`。
 *
 * prop 派生字段（initValues / config / ...）已经在上方用 getter 定义，
 * 这里不再重复同步；因此 `props.initValues` 这类高频变化也不会再触发
 * `extendState` 重跑（旧版的性能问题修复点）。
 *
 * 实现细节：
 * - data 描述符：通过 `formState[key] = value` 走 reactive proxy 的 set，
 *   触发依赖通知；与旧版「逐项赋值」语义完全等价。
 * - accessor 描述符（`{ get stage() {...} }`）按原样写入 formState，调用方
 *   可以自行控制读时求值；强制 `configurable: true` 以便下一次重跑可再 define。
 */
watchEffect(async (onCleanup) => {
  const { extendState } = props;
  if (typeof extendState !== 'function') return;

  let stale = false;
  onCleanup(() => {
    stale = true;
  });

  let state: Record<string, any> = {};
  try {
    state = (await extendState(formState)) || {};
  } catch (e) {
    console.error('[MForm] extendState failed:', e);
    return;
  }
  if (stale) return;

  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(state))) {
    if ('value' in descriptor) {
      (formState as any)[key] = (state as any)[key];
    } else {
      descriptor.configurable = true;
      Object.defineProperty(formState, key, descriptor);
    }
  }
});

provide('mForm', formState);

const changeRecords = shallowRef<ChangeRecord[]>([]);

watch(
  [() => props.config, () => props.initValues],
  ([config], [preConfig]) => {
    changeRecords.value = [];

    if (!isEqual(toRaw(config), toRaw(preConfig))) {
      initialized.value = false;
    }

    initValue(formState, {
      initValues: props.initValues,
      config: props.config,
    }).then((value) => {
      values.value = value;
      // 非对比模式，初始化完成
      initialized.value = !props.isCompare;
    });

    if (props.isCompare) {
      // 对比模式下初始化待对比的表单值
      initValue(formState, {
        initValues: props.lastValues,
        config: props.config,
      }).then((value) => {
        lastValuesProcessed.value = value;
        initialized.value = true;
      });
    }
  },
  { immediate: true },
);

const changeHandler = (v: FormValue, eventData: ContainerChangeEventData) => {
  if (eventData.changeRecords?.length) {
    for (const record of eventData.changeRecords) {
      if (record.propPath) {
        const index = changeRecords.value.findIndex((item) => item.propPath === record.propPath);
        if (index > -1) {
          changeRecords.value[index] = record;
        } else {
          changeRecords.value.push(record);
        }

        setValueByKeyPath(record.propPath, record.value, values.value);
      }
    }
  }
  emit('change', values.value, eventData);
};

const submitHandler = (e: SubmitEvent) => {
  if (props.preventSubmitDefault) {
    e.preventDefault();
  }
};

/**
 * 通过 name 从 config 中查找对应的 text
 * @param name - 字段名，支持点分隔的路径格式，如 'a.b.c'
 * @param config - 表单配置数组
 * @returns 找到的 text 值，如果未找到则返回 undefined
 */
const getTextByName = (name: string, config: FormConfig = props.config): string | undefined => {
  if (!name || !Array.isArray(config)) return undefined;

  const nameParts = name.split('.');

  const findInConfig = (configs: FormConfig, parts: string[]): string | undefined => {
    if (parts.length === 0) return undefined;

    const [currentPart, ...remainingParts] = parts;

    for (const item of configs) {
      if (item.name === currentPart) {
        if (remainingParts.length === 0) {
          return typeof item.text === 'string' ? item.text : undefined;
        }

        if ('items' in item && Array.isArray(item.items)) {
          const result = findInConfig(item.items, remainingParts);
          if (result !== undefined) return result;
        }
      }

      if ('items' in item && Array.isArray(item.items)) {
        const result = findInConfig(item.items, parts);
        if (result !== undefined) return result;
      }
    }

    return undefined;
  };

  return findInConfig(config, nameParts);
};

defineExpose({
  values,
  lastValuesProcessed,
  formState,
  initialized,
  changeRecords,

  changeHandler,

  resetForm: () => {
    tMagicFormRef.value?.resetFields();
    changeRecords.value = [];
  },

  submitForm: async (native?: boolean): Promise<any> => {
    try {
      const result = await tMagicFormRef.value?.validate();
      // tdesign 错误通过返回值返回
      // element-plus 通过throw error
      if (result !== true) {
        throw result;
      }
      changeRecords.value = [];
      return native ? values.value : cloneDeep(toRaw(values.value));
    } catch (invalidFields: any) {
      emit('error', invalidFields);

      const error: string[] = [];

      Object.entries(invalidFields).forEach(([prop, ValidateError]) => {
        (ValidateError as ValidateError[]).forEach(({ field, message }) => {
          const name = field || prop;
          const text = getTextByName(name, props.config) || name;

          error.push(`${text} -> ${message}`);
        });
      });

      throw new Error(error.join('<br>'));
    }
  },

  getTextByName,
});
</script>
