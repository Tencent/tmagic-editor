<template>
  <component
    v-if="disabled || isFocused"
    :is="getConfig('components')?.autocomplete.component || 'el-autocomplete'"
    class="tmagic-design-auto-complete"
    ref="autocomplete"
    v-model="state"
    v-bind="
      getConfig('components')?.autocomplete.props({
        disabled,
        size,
        fetchSuggestions: querySearch,
        triggerOnFocus: false,
        clearable: true,
      }) || {}
    "
    style="width: 100%"
    @blur="blurHandler"
    @input="inputHandler"
    @select="selectHandler"
  >
    <template #suffix>
      <Icon :icon="Coin" />
    </template>
    <template #default="{ item }">
      <div style="display: flex; flex-direction: column; line-height: 1.2em">
        <div>{{ item.text }}</div>
        <span style="font-size: 10px; color: rgba(0, 0, 0, 0.6)">{{ item.value }}</span>
      </div>
    </template>
  </component>
  <div
    :class="`tmagic-data-source-input-text el-input t-input t-size-${size?.[0]} el-input--${size}`"
    @mouseup="mouseupHandler"
    v-else
  >
    <div :class="`tmagic-data-source-input-text-wrapper el-input__wrapper ${isFocused ? ' is-focus' : ''}`">
      <div class="el-input__inner t-input__inner">
        <template v-for="(item, index) in displayState">
          <span :key="index" v-if="item.type === 'text'" style="margin-right: 2px">{{ item.value }}</span>
          <TMagicTag :key="index" :size="size" v-if="item.type === 'var'">{{ item.value }}</TMagicTag>
        </template>

        <Icon class="tmagic-data-source-input-icon" :icon="Coin" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue';
import { Coin } from '@element-plus/icons-vue';

import { getConfig, TMagicAutocomplete, TMagicTag } from '@tmagic/design';
import type { FieldProps, FormItem } from '@tmagic/form';
import type { DataSchema, DataSourceSchema } from '@tmagic/schema';
import { isNumber } from '@tmagic/utils';

import Icon from '@editor/components/Icon.vue';
import type { Services } from '@editor/type';
import { getDisplayField } from '@editor/utils/data-source';

defineOptions({
  name: 'MFieldsDataSourceInput',
});

const props = withDefaults(
  defineProps<
    FieldProps<
      {
        type: 'data-source-input';
      } & FormItem
    >
  >(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  change: [value: string];
}>();

const { dataSourceService } = inject<Services>('services') || {};

const autocomplete = ref<InstanceType<typeof TMagicAutocomplete>>();
const isFocused = ref(false);
const state = ref('');
const displayState = ref<{ value: string; type: 'var' | 'text' }[]>([]);

const input = computed<HTMLInputElement>(() => autocomplete.value?.inputRef?.input);
const dataSources = computed(() => dataSourceService?.get('dataSources') || []);

const setDisplayState = () => {
  displayState.value = getDisplayField(dataSources.value, state.value);
};

watch(
  () => props.model[props.name],
  (value = '') => {
    state.value = value;

    setDisplayState();
  },
  { immediate: true },
);

const mouseupHandler = async () => {
  const selection = globalThis.document.getSelection();
  const anchorOffset = selection?.anchorOffset || 0;
  const focusOffset = selection?.focusOffset || 0;

  isFocused.value = true;
  await nextTick();
  autocomplete.value?.focus();

  if (focusOffset && input.value) {
    input.value.setSelectionRange(anchorOffset, focusOffset);
  }
};

const blurHandler = () => {
  isFocused.value = false;

  setDisplayState();

  emit('change', state.value);
};

const changeHandler = (v: string) => {
  emit('change', v);
};

let inputText = '';

const inputHandler = (v: string) => {
  if (!v) {
    inputText = v;
  }
};

/**
 * 光标位置是不是}
 * @param selectionStart 光标位置
 */
const isRightCurlyBracket = (selectionStart = 0) => {
  const lastChar = inputText.substring(selectionStart - 1, selectionStart);
  return lastChar === '}';
};

/**
 * 获取光标位置
 */
const getSelectionStart = () => {
  let selectionStart = input.value?.selectionStart || 0;

  // 输入法可能会自动补全}，如果当前光标前面一个字符是}，则光标前移一位
  if (isRightCurlyBracket(selectionStart)) {
    selectionStart -= 1;
  }

  return selectionStart;
};

/**
 * 当前输入的是{
 * @param leftCurlyBracketIndex {字符索引
 */
const curCharIsLeftCurlyBracket = (leftCurlyBracketIndex: number) =>
  leftCurlyBracketIndex > 0 && leftCurlyBracketIndex === getSelectionStart() - 1;

/**
 * 当前输入的是.
 * @param leftCurlyBracketIndex .字符索引
 */
const curCharIsDot = (dotIndex: number) => dotIndex > -1 && dotIndex === getSelectionStart() - 1;

/**
 * @param leftCurlyBracketIndex 左大括号字符索引
 * @param cb 建议的方法
 */
const dsQuerySearch = (queryString: string, leftCurlyBracketIndex: number, cb: (data: { value: string }[]) => void) => {
  let result: DataSourceSchema[] = [];

  if (curCharIsLeftCurlyBracket(leftCurlyBracketIndex)) {
    // 当前输入的是{
    result = dataSources.value;
  } else if (leftCurlyBracketIndex > 0) {
    // 当前输入的是{xx
    const queryName = queryString.substring(leftCurlyBracketIndex + 1).toLowerCase();
    result = dataSources.value.filter((ds) => ds.title?.toLowerCase().includes(queryName) || ds.id.includes(queryName));
  }

  cb(
    result.map((ds) => ({
      value: ds.id,
      text: ds.title,
      type: 'dataSource',
    })),
  );
};

/**
 * 字段提示
 * @param queryString 当前输入框内的字符串
 * @param leftAngleIndex {字符索引
 * @param dotIndex .字符索引
 * @param cb 建议回调
 */
const fieldQuerySearch = (
  queryString: string,
  leftAngleIndex: number,
  dotIndex: number,
  cb: (data: { value: string }[]) => void,
) => {
  let result: DataSchema[] = [];

  const dsKey = queryString.substring(leftAngleIndex + 1, dotIndex);

  // 可能是xx.xx.xx，存在链式调用
  const keys = dsKey.replaceAll(/\[(\d+)\]/g, '.$1').split('.');

  // 最前的是数据源id
  const dsId = keys.shift();
  const ds = dataSources.value.find((ds) => ds.id === dsId);
  if (!ds) {
    cb([]);
    return;
  }

  let fields = ds.fields || [];

  // 后面这些是字段
  let key = keys.shift();
  while (key) {
    if (isNumber(key)) {
      key = keys.shift();
      continue;
    }

    for (const field of fields) {
      if (field.name === key) {
        fields = field.fields || [];
        key = keys.shift();
        break;
      }
    }
  }

  if (curCharIsDot(dotIndex)) {
    // 当前输入的是.
    result = fields || [];
  } else if (dotIndex > -1) {
    const queryName = queryString.substring(dotIndex + 1).toLowerCase();
    result =
      fields.filter(
        (field) => field.name?.toLowerCase().includes(queryName) || field.title?.toLowerCase().includes(queryName),
      ) || [];
  }

  cb(
    result.map((field) => ({
      value: field.name,
      text: field.title,
      type: 'field',
    })),
  );
};

/**
 * 数据源提示
 * @param queryString 当前输入框内的字符串
 * @param cb 建议回调
 */
const querySearch = (queryString: string, cb: (data: { value: string }[]) => void) => {
  inputText = queryString;

  const selectionStart = getSelectionStart();

  const curQueryString = queryString.substring(0, selectionStart);

  const fieldKeyStringLastIndex = curQueryString.lastIndexOf('.');
  const dsKeyStringLastIndex = curQueryString.lastIndexOf('${') + 1;

  const isFieldTip = fieldKeyStringLastIndex > dsKeyStringLastIndex;

  if (isFieldTip) {
    fieldQuerySearch(curQueryString, dsKeyStringLastIndex, fieldKeyStringLastIndex, cb);
  } else {
    dsQuerySearch(curQueryString, dsKeyStringLastIndex, cb);
  }
};

/**
 * 选择建议
 * @param value 建议值
 * @param type 建议类型，是数据源还是字段
 */
const selectHandler = async ({ value, type }: { value: string; type: 'dataSource' | 'field' }) => {
  const isDataSource = type === 'dataSource';
  const selectionStart = input.value?.selectionStart || 0;
  let startText = inputText.substring(0, selectionStart);

  const dotIndex = startText.lastIndexOf('.');
  const leftCurlyBracketIndex = startText.lastIndexOf('${') + 1;

  const endText = inputText.substring(selectionStart);

  let suggestText = value;

  if (isDataSource) {
    if (!curCharIsLeftCurlyBracket(leftCurlyBracketIndex)) {
      startText = startText.substring(0, leftCurlyBracketIndex + 1);
    }

    // 当前光标后一位是否为}，不是的话需要补上
    if (!isRightCurlyBracket(selectionStart + 1)) {
      suggestText = `${suggestText}}`;
    }
  } else if (!curCharIsDot(dotIndex)) {
    startText = startText.substring(0, dotIndex + 1);
  }

  state.value = `${startText}${suggestText}${endText}`;

  await nextTick();

  // 由于选择数据源时会在后面补全}, 所以光标要前移2位
  let newSelectionStart = 0;
  if (isDataSource) {
    newSelectionStart = leftCurlyBracketIndex + suggestText.length;
  } else {
    newSelectionStart = dotIndex + suggestText.length + 1;
  }
  input.value?.setSelectionRange(newSelectionStart, newSelectionStart);

  changeHandler(state.value);
};
</script>
