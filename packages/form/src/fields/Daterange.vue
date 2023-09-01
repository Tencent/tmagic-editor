<template>
  <div>
    <div v-for="(item, index) in list" :key="index">
      <TMagicDatePicker
        v-model="list[index]"
        type="datetimerange"
        range-separator="-"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :size="size"
        :unlink-panels="true"
        :disabled="disabled"
        :default-time="config.defaultTime"
        @change="changeHandler($event, index)"
      ></TMagicDatePicker>
      <span v-show="list.length > 1">
        &nbsp;
        <TMagicIcon class="m-table-delete-icon" @click="removeHandler(index)"><Delete /></TMagicIcon>
      </span>
    </div>
    <TMagicButton v-if="addable" size="small" type="primary" plain @click="newHandler()">新增一行</TMagicButton>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { Delete } from '@element-plus/icons-vue';

import { TMagicButton, TMagicDatePicker, TMagicIcon } from '@tmagic/design';
import { datetimeFormatter } from '@tmagic/utils';

import type { DaterangeConfig, FieldProps } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormDateRange',
});

const props = defineProps<FieldProps<DaterangeConfig>>();

const emit = defineEmits(['change']);

useAddField(props.prop);

// eslint-disable-next-line vue/no-setup-props-destructure
const { names } = props.config;
const value = ref<(Date | undefined)[] | null>([]);
const list = ref<any>([[]]);
const addable = computed(() => Boolean(props.config.addable));

if (props.model !== undefined) {
  if (names?.length) {
    watch(
      [() => props.model[names[0]], () => props.model[names[1]]],
      ([start, end], [preStart, preEnd]) => {
        if (!value.value) {
          value.value = [];
        }
        if (!start || !end) value.value = [];
        if (start !== preStart) value.value[0] = new Date(start);
        if (end !== preEnd) value.value[1] = new Date(end);
        list.value[0] = value.value;
      },
      {
        immediate: true,
      },
    );
  } else if (props.name && props.model[props.name]) {
    watch(
      () => props.model[props.name],
      (start, preStart) => {
        if (Array.isArray(start) && start.length > 0) {
          list.value = start;
          return;
        }
        if (start !== preStart) list.value[0] = start.map((item: string) => (item ? new Date(item) : undefined));
      },
      {
        immediate: true,
      },
    );
  }
}

const setValue = (v: Date[] | Date) => {
  names?.forEach((item, index) => {
    if (!props.model) {
      return;
    }
    if (Array.isArray(v)) {
      props.model[item] = datetimeFormatter(v[index]?.toString(), '');
    } else {
      props.model[item] = undefined;
    }
  });
};

const changeHandler = (v: Date[], index: number) => {
  const value = v || [];

  if (props.name) {
    const dateTime = value.map((item?: Date) => {
      if (item) return datetimeFormatter(item, '');
      return undefined;
    });
    if (list.value.length === 1) {
      emit('change', dateTime);
      return;
    }
    list.value[index] = dateTime;
    emit('change', list.value);
  } else {
    if (names?.length) {
      setValue(value);
    }
    emit('change', value);
  }
};

const newHandler = () => {
  list.value.push([]);
};

const removeHandler = (index: number) => {
  list.value.splice(index, 1);
  emit('change', list.value);
};
</script>
