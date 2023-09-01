<template>
  <div>
    <div v-for="(item, index) in list" :key="index">
      <TMagicTimePicker
        v-model="list[index]"
        is-range
        range-separator="-"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        :size="size"
        :unlink-panels="true"
        :disabled="disabled"
        :default-time="config.defaultTime"
        @change="changeHandler($event, index)"
      ></TMagicTimePicker>
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

import { TMagicButton, TMagicIcon, TMagicTimePicker } from '@tmagic/design';
import { datetimeFormatter } from '@tmagic/utils';

import type { DaterangeConfig, FieldProps } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormTimeRange',
});

const props = defineProps<FieldProps<DaterangeConfig>>();

const emit = defineEmits(['change']);

useAddField(props.prop);

// eslint-disable-next-line vue/no-setup-props-destructure
const list = ref<any>([[]]);
const addable = computed(() => Boolean(props.config.addable));
if (props.name && props.model[props.name]) {
  watch(
    () => props.model[props.name],
    (ranges) => {
      if (Array.isArray(ranges) && ranges.length > 0) {
        list.value = ranges;
      }
    },
    {
      immediate: true,
    },
  );
}

const changeHandler = (v: Date[], index: number) => {
  const value = v || [];
  list.value[index] = value.map((item?: Date) => {
    if (item) return datetimeFormatter(item, '');
    return undefined;
  });
  emit('change', list.value);
};

const newHandler = () => {
  list.value.push([]);
};

const removeHandler = (index: number) => {
  list.value.splice(index, 1);
  emit('change', list.value);
};
</script>
