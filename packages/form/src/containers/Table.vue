<template>
  <div ref="mTable" class="m-fields-table" :class="{ 'm-fields-table-item-extra': config.itemExtra }">
    <span v-if="config.extra" style="color: rgba(0, 0, 0, 0.45)" v-html="config.extra"></span>
    <div class="el-form-item__content">
      <TMagicTooltip content="拖拽可排序" placement="left-start" :disabled="config.dropSort !== true">
        <TMagicTable
          v-if="model[modelName]"
          ref="tMagicTable"
          style="width: 100%"
          :row-key="config.rowKey || 'id'"
          :data="data"
          :lastData="lastData"
          :border="config.border"
          :max-height="config.maxHeight"
          :default-expand-all="true"
          :key="updateKey"
          @select="selectHandle"
          @sort-change="sortChange"
        >
          <TMagicTableColumn v-if="config.itemExtra" :fixed="'left'" width="30" type="expand">
            <template v-slot="scope">
              <span v-html="itemExtra(config.itemExtra, scope.$index)" class="m-form-tip"></span>
            </template>
          </TMagicTableColumn>

          <TMagicTableColumn
            label="操作"
            :width="config.operateColWidth || 55"
            align="center"
            :fixed="config.fixed === false ? undefined : 'left'"
          >
            <template v-slot="scope">
              <slot name="operateCol" :scope="scope"></slot>
              <TMagicIcon
                v-show="showDelete(scope.$index + 1 + pagecontext * pagesize - 1)"
                class="m-table-delete-icon"
                @click="removeHandler(scope.$index + 1 + pagecontext * pagesize - 1)"
                ><Delete
              /></TMagicIcon>
            </template>
          </TMagicTableColumn>

          <TMagicTableColumn v-if="sort && model[modelName] && model[modelName].length > 1" label="排序" width="60">
            <template v-slot="scope">
              <TMagicTooltip
                v-if="scope.$index + 1 + pagecontext * pagesize - 1 !== 0"
                content="点击上移，双击置顶"
                placement="top"
              >
                <TMagicButton
                  plain
                  size="small"
                  type="primary"
                  :icon="ArrowUp"
                  :disabled="disabled"
                  text
                  @click="upHandler(scope.$index + 1 + pagecontext * pagesize - 1)"
                  @dblclick="topHandler(scope.$index + 1 + pagecontext * pagesize - 1)"
                ></TMagicButton>
              </TMagicTooltip>
              <TMagicTooltip
                v-if="scope.$index + 1 + pagecontext * pagesize - 1 !== model[modelName].length - 1"
                content="点击下移，双击置底"
                placement="top"
              >
                <TMagicButton
                  plain
                  size="small"
                  type="primary"
                  :icon="ArrowDown"
                  :disabled="disabled"
                  text
                  @click="downHandler(scope.$index + 1 + pagecontext * pagesize - 1)"
                  @dblclick="bottomHandler(scope.$index + 1 + pagecontext * pagesize - 1)"
                ></TMagicButton>
              </TMagicTooltip>
            </template>
          </TMagicTableColumn>

          <TMagicTableColumn
            v-if="selection"
            align="center"
            header-align="center"
            type="selection"
            width="45"
          ></TMagicTableColumn>

          <TMagicTableColumn width="60" label="序号" v-if="showIndex && config.showIndex">
            <template v-slot="scope">{{ scope.$index + 1 + pagecontext * pagesize }}</template>
          </TMagicTableColumn>

          <template v-for="(column, index) in config.items">
            <TMagicTableColumn
              v-if="column.type !== 'hidden' && display(column.display)"
              :prop="column.name"
              :width="column.width"
              :label="column.label"
              :sortable="column.sortable"
              :sort-orders="['ascending', 'descending']"
              :key="column[mForm?.keyProp || '__key'] ?? index"
              :class-name="config.dropSort === true ? 'el-table__column--dropable' : ''"
            >
              <template #default="scope">
                <Container
                  v-if="scope.$index > -1"
                  labelWidth="0"
                  :disabled="disabled"
                  :prop="getProp(scope.$index)"
                  :rules="column.rules"
                  :config="makeConfig(column, scope.row)"
                  :model="scope.row"
                  :lastValues="lastData[scope.$index]"
                  :is-compare="isCompare"
                  :size="size"
                  @change="$emit('change', model[modelName])"
                  @addDiffCount="onAddDiffCount()"
                ></Container>
              </template>
            </TMagicTableColumn>
          </template>
        </TMagicTable>
      </TMagicTooltip>
      <slot></slot>
      <TMagicButton v-if="addable" size="small" type="primary" :disabled="disabled" plain @click="newHandler()"
        >添加</TMagicButton
      >
      &nbsp;
      <TMagicButton
        :icon="Grid"
        size="small"
        type="primary"
        @click="toggleMode"
        v-if="enableToggleMode && !isFullscreen"
        >展开配置</TMagicButton
      >
      <TMagicButton
        :icon="FullScreen"
        size="small"
        type="primary"
        @click="toggleFullscreen"
        v-if="config.enableFullscreen !== false"
      >
        {{ isFullscreen ? '退出全屏' : '全屏编辑' }}
      </TMagicButton>
      <TMagicUpload
        v-if="importable"
        style="display: inline-block"
        ref="excelBtn"
        action="/noop"
        :disabled="disabled"
        :on-change="excelHandler"
        :auto-upload="false"
      >
        <TMagicButton size="small" type="success" :disabled="disabled" plain>导入EXCEL</TMagicButton> </TMagicUpload
      >&nbsp;
      <TMagicButton v-if="importable" size="small" type="warning" :disabled="disabled" plain @click="clearHandler()"
        >清空</TMagicButton
      >
    </div>

    <div class="bottom" style="text-align: right" v-if="config.pagination">
      <TMagicPagination
        layout="total, sizes, prev, pager, next, jumper"
        :hide-on-single-page="model[modelName].length < pagesize"
        :current-page="pagecontext + 1"
        :page-sizes="[pagesize, 60, 120, 300]"
        :page-size="pagesize"
        :total="model[modelName].length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      >
      </TMagicPagination>
    </div>
  </div>
</template>

<script setup lang="ts" name="MFormTable">
import { computed, inject, onMounted, ref, toRefs, watchEffect } from 'vue';
import { ArrowDown, ArrowUp, Delete, FullScreen, Grid } from '@element-plus/icons-vue';
import { cloneDeep } from 'lodash-es';
import Sortable, { SortableEvent } from 'sortablejs';

import {
  TMagicButton,
  TMagicIcon,
  tMagicMessage,
  TMagicPagination,
  TMagicTable,
  TMagicTableColumn,
  TMagicTooltip,
  TMagicUpload,
} from '@tmagic/design';
import { asyncLoadJs, sleep } from '@tmagic/utils';

import { ColumnConfig, FormState, SortProp, TableConfig } from '../schema';
import { display as displayFunc, initValue } from '../utils/form';

import Container from './Container.vue';

const props = withDefaults(
  defineProps<{
    model: any;
    lastValues?: any;
    isCompare?: boolean;
    config: TableConfig;
    name: string;
    prop?: string;
    labelWidth?: string;
    sort?: boolean;
    disabled?: boolean;
    sortKey?: string;
    text?: string;
    size?: string;
    enableToggleMode?: boolean;
    showIndex?: boolean;
  }>(),
  {
    prop: '',
    sortKey: '',
    enableToggleMode: true,
    showIndex: true,
    lastValues: () => ({}),
    isCompare: false,
  },
);

const emit = defineEmits(['change', 'select', 'addDiffCount']);

let timer: any | null = null;
const mForm = inject<FormState | undefined>('mForm');

const tMagicTable = ref<InstanceType<typeof TMagicTable>>();
const excelBtn = ref<InstanceType<typeof TMagicUpload>>();
const mTable = ref<HTMLDivElement>();

const pagesize = ref(10);
const pagecontext = ref(0);
const updateKey = ref(1);
const isFullscreen = ref(false);

const modelName = computed(() => props.name || props.config.name || '');

const data = computed(() =>
  props.config.pagination
    ? props.model[modelName.value].filter(
        (item: any, index: number) =>
          index >= pagecontext.value * pagesize.value && index + 1 <= (pagecontext.value + 1) * pagesize.value,
      )
    : props.model[modelName.value],
);

const lastData = computed(() =>
  props.config.pagination
    ? props.lastValues[modelName.value].filter(
        (item: any, index: number) =>
          index >= pagecontext.value * pagesize.value && index + 1 <= (pagecontext.value + 1) * pagesize.value,
      )
    : props.lastValues[modelName.value] || {},
);

const sortChange = ({ prop, order }: SortProp) => {
  if (order === 'ascending') {
    props.model[modelName.value] = props.model[modelName.value].sort((a: any, b: any) => a[prop] - b[prop]);
  } else if (order === 'descending') {
    props.model[modelName.value] = props.model[modelName.value].sort((a: any, b: any) => b[prop] - a[prop]);
  }
};

const foreUpdate = () => {
  updateKey.value += 1;
  setTimeout(() => rowDrop());
};

const swapArray = (index1: number, index2: number) => {
  [props.model[modelName.value][index1]] = props.model[modelName.value].splice(
    index2,
    1,
    props.model[modelName.value][index1],
  );
  if (props.sortKey) {
    for (let i = props.model[modelName.value].length - 1, v = 0; i >= 0; i--, v++) {
      props.model[modelName.value][v][props.sortKey] = i;
    }
  }
  mForm?.$emit('field-change', props.prop, props.model[modelName.value]);
};

const rowDrop = () => {
  const tableEl = tMagicTable.value?.instance.$el;
  const tBodyEl = tableEl?.querySelector('.el-table__body > tbody');
  if (tBodyEl) {
    // eslint-disable-next-line prefer-destructuring
    const sortable = Sortable.create(tBodyEl, {
      onEnd: ({ newIndex, oldIndex }: SortableEvent) => {
        if (typeof newIndex === 'undefined') return;
        if (typeof oldIndex === 'undefined') return;
        swapArray(newIndex, oldIndex);
        emit('change', props.model[modelName.value]);
        foreUpdate();
        sortable.destroy();
        mForm?.$emit('field-change', props.prop, props.model[modelName.value]);
        sleep(1000).then(() => {
          const elTrs = tableEl.querySelectorAll('.el-table__body > tbody > tr');
          if (elTrs?.[newIndex]) {
            elTrs[newIndex].style.backgroundColor = 'rgba(243, 89, 59, 0.2)';
            sleep(1000).then(() => {
              elTrs[newIndex].style.backgroundColor = '';
            });
          }
        });
      },
    });
  }
};

const newHandler = async (row?: any) => {
  if (props.config.max && props.model[modelName.value].length >= props.config.max) {
    tMagicMessage.error(`最多新增配置不能超过${props.config.max}条`);
    return;
  }

  const columns = props.config.items;
  const enumValues = props.config.enum || [];
  let enumV = [];
  const { length } = props.model[modelName.value];
  const key = props.config.key || 'id';
  let inputs: any = {};

  if (enumValues.length) {
    if (length >= enumValues.length) {
      return;
    }
    enumV = enumValues.filter((item) => {
      let i = 0;
      for (; i < length; i++) {
        if (item[key] === props.model[modelName.value][i][key]) {
          break;
        }
      }
      return i === length;
    });

    if (enumV.length > 0) {
      // eslint-disable-next-line prefer-destructuring
      inputs = enumV[0];
    }
  } else if (Array.isArray(row)) {
    columns.forEach((column, index) => {
      column.name && (inputs[column.name] = row[index]);
    });
  } else {
    if (typeof props.config.defaultAdd === 'function') {
      inputs = await props.config.defaultAdd(mForm, {
        model: props.model[modelName.value],
        formValue: mForm?.values,
      });
    } else if (props.config.defaultAdd) {
      inputs = props.config.defaultAdd;
    }

    inputs = await initValue(mForm, {
      config: columns,
      initValues: inputs,
    });
  }

  if (props.sortKey && length) {
    inputs[props.sortKey] = props.model[modelName.value][length - 1][props.sortKey] - 1;
  }

  props.model[modelName.value].push(inputs);
  emit('change', props.model[modelName.value]);
};

if (!(globalThis as any).XLSX) {
  asyncLoadJs('https://cdn.bootcdn.net/ajax/libs/xlsx/0.17.0/xlsx.full.min.js');
}

onMounted(() => {
  if (props.config.defautSort) {
    sortChange(props.config.defautSort);
  } else if (props.config.defaultSort) {
    sortChange(props.config.defaultSort);
  }

  if (props.sort && props.sortKey) {
    props.model[modelName.value].sort((a: any, b: any) => b[props.sortKey] - a[props.sortKey]);
  }
});

watchEffect(() => {
  if (props.config.dropSort) {
    rowDrop();
  }
});

const addable = computed(() => {
  if (!props.model[modelName.value].length) {
    return true;
  }
  if (typeof props.config.addable === 'function') {
    return props.config.addable(mForm, {
      model: props.model[modelName.value],
      formValue: mForm?.values,
      prop: props.prop,
    });
  }
  return typeof props.config.addable === 'undefined' ? true : props.config.addable;
});

const selection = computed(() => {
  if (typeof props.config.selection === 'function') {
    return props.config.selection(mForm, { model: props.model[modelName.value] });
  }
  return props.config.selection;
});

const importable = computed(() => {
  if (typeof props.config.importable === 'function') {
    return props.config.importable(mForm, {
      formValue: mForm?.values,
      model: props.model[modelName.value],
    });
  }
  return typeof props.config.importable === 'undefined' ? false : props.config.importable;
});

const display = (fuc: any) => displayFunc(mForm, fuc, props);

const itemExtra = (fuc: any, index: number) => {
  if (typeof fuc === 'function') {
    return fuc(mForm, {
      values: mForm?.initValues,
      model: props.model,
      formValue: mForm ? mForm.values : props.model,
      prop: props.prop,
      index,
    });
  }

  return fuc;
};

const removeHandler = (index: number) => {
  if (props.disabled) return;
  props.model[modelName.value].splice(index, 1);
  emit('change', props.model[modelName.value]);
};

const selectHandle = (selection: any, row: any) => {
  if (typeof props.config.selection === 'string' && props.config.selection === 'single') {
    tMagicTable.value?.clearSelection();
    tMagicTable.value?.toggleRowSelection(row, true);
  }
  emit('select', selection, row);
  if (typeof props.config.onSelect === 'function') {
    props.config.onSelect(mForm, { selection, row, config: props.config });
  }
};

const toggleRowSelection = (row: any, selected: boolean) => {
  tMagicTable.value?.toggleRowSelection.call(tMagicTable.value, row, selected);
};

const makeConfig = (config: ColumnConfig, row: any) => {
  const newConfig = cloneDeep(config);
  if (typeof config.itemsFunction === 'function') {
    newConfig.items = config.itemsFunction(row);
  }
  delete newConfig.display;
  return newConfig;
};

const upHandler = (index: number) => {
  if (timer) {
    clearTimeout(timer);
  }

  timer = setTimeout(() => {
    swapArray(index, index - 1);
  }, 300);
};

const topHandler = (index: number) => {
  if (timer) {
    clearTimeout(timer);
  }

  // 首先判断当前元素需要上移几个位置,置底移动到数组的第一位
  const moveNum = index;

  // 循环出需要一个一个上移的次数
  for (let i = 0; i < moveNum; i++) {
    swapArray(index, index - 1);
    index -= 1;
  }
};

const downHandler = (index: number) => {
  if (timer) {
    clearTimeout(timer);
  }

  timer = setTimeout(() => {
    swapArray(index, index + 1);
  }, 300);
};

const bottomHandler = (index: number) => {
  if (timer) {
    clearTimeout(timer);
  }

  // 首先判断当前元素需要上移几个位置,置底移动到数组的第一位
  const moveNum = props.model[modelName.value].length - 1 - index;

  // 循环出需要一个一个上移的次数
  for (let i = 0; i < moveNum; i++) {
    swapArray(index, index + 1);
    index += 1;
  }
};

// 希望支持单行可控制是否显示删除按钮，不会影响现有逻辑
const showDelete = (index: number) => {
  const deleteFunc = props.config.delete;
  if (deleteFunc && typeof deleteFunc === 'function') {
    return deleteFunc(props.model[modelName.value], index, mForm?.values);
  }
  return true;
};

const clearHandler = () => {
  const len = props.model[modelName.value].length;
  props.model[modelName.value].splice(0, len);
  mForm?.$emit('field-change', props.prop, props.model[modelName.value]);
};

const excelHandler = (file: any) => {
  if (!file || !file.raw) {
    return false;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const data = reader.result;
    const pdata = (globalThis as any).XLSX.read(data, { type: 'array' });
    pdata.SheetNames.forEach((sheetName: string) => {
      const arr = (globalThis as any).XLSX.utils.sheet_to_json(pdata.Sheets[sheetName], { header: 1 });
      if (arr?.[0]) {
        arr.forEach((row: any) => {
          newHandler(row);
        });
      }
      setTimeout(() => {
        excelBtn.value?.clearFiles();
      }, 300);
    });
  };
  reader.readAsArrayBuffer(file.raw);

  return false;
};

const handleSizeChange = (val: number) => {
  pagesize.value = val;
};

const handleCurrentChange = (val: number) => {
  pagecontext.value = val - 1;
};

const toggleMode = () => {
  const calcLabelWidth = (label: string) => {
    if (!label) return '0px';
    const zhLength = label.match(/[^\x00-\xff]/g)?.length || 0;
    const chLength = label.length - zhLength;
    return `${Math.max(chLength * 8 + zhLength * 20, 80)}px`;
  };

  // 切换为groupList的形式
  props.config.type = 'groupList';
  props.config.enableToggleMode = true;
  props.config.tableItems = props.config.items;
  props.config.items =
    props.config.groupItems ||
    props.config.items.map((item: any) => {
      const text = item.text || item.label;
      const labelWidth = calcLabelWidth(text);
      return {
        ...item,
        text,
        labelWidth,
        span: item.span || 12,
      };
    });
};

const toggleFullscreen = () => {
  if (isFullscreen.value) {
    mTable.value?.classList.remove('fixed');
    isFullscreen.value = false;
  } else {
    mTable.value?.classList.add('fixed');
    isFullscreen.value = true;
  }
};

const getProp = (index: number) => {
  const { prop } = toRefs(props);
  return `${prop.value}${prop.value ? '.' : ''}${index + 1 + pagecontext.value * pagesize.value - 1}`;
};

const onAddDiffCount = () => emit('addDiffCount');

defineExpose({
  toggleRowSelection,
});
</script>
