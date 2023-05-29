<template>
  <div class="m-fields-key-value">
    <div class="m-fields-key-value-item" v-for="(item, index) in records" :key="index">
      <TMagicInput
        placeholder="key"
        v-model="records[index][0]"
        :disabled="disabled"
        :size="size"
        @change="keyChangeHandler"
      ></TMagicInput>
      <span class="m-fileds-key-value-delimiter">:</span>
      <TMagicInput
        placeholder="value"
        v-model="records[index][1]"
        :disabled="disabled"
        :size="size"
        @change="valueChangeHandler"
      ></TMagicInput>

      <TMagicButton
        class="m-fileds-key-value-delete"
        type="danger"
        :size="size"
        circle
        plain
        :icon="Delete"
        @click="deleteHandler(index)"
      ></TMagicButton>
    </div>

    <TMagicButton type="primary" :size="size" plain :icon="Plus" @click="addHandler">添加</TMagicButton>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { Delete, Plus } from '@element-plus/icons-vue';

import { TMagicButton, TMagicInput } from '@tmagic/design';

defineOptions({
  name: 'MEditorKeyValue',
});

const props = withDefaults(
  defineProps<{
    config: {
      type: 'key-value';
      name: string;
      text: string;
    };
    model: Record<string, any>;
    name: string;
    prop: string;
    disabled: boolean;
    lastValues?: Record<string, any>;
    size?: 'large' | 'default' | 'small';
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<(e: 'change', value: Record<string, any>) => void>();

const records = ref<[string, string][]>([]);

watchEffect(() => {
  records.value = Object.entries(props.model[props.name] || {});
});

const getValue = () => {
  const record: Record<string, string> = {};
  records.value.forEach(([key, value]) => {
    if (key) {
      record[key] = value;
    }
  });
  return record;
};

const keyChangeHandler = () => {
  emit('change', getValue());
};

const valueChangeHandler = () => {
  emit('change', getValue());
};

const addHandler = () => {
  records.value.push(['', '']);
};

const deleteHandler = (index: number) => {
  records.value.splice(index, 1);
};
</script>
