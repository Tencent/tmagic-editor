<template>
  <div class="m-fields-key-value">
    <div v-if="!showCode">
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
          :disabled="disabled"
          circle
          plain
          :icon="Delete"
          @click="deleteHandler(index)"
        ></TMagicButton>
      </div>

      <TMagicButton type="primary" :size="size" :disabled="disabled" plain :icon="Plus" @click="addHandler"
        >添加</TMagicButton
      >
    </div>

    <MagicCodeEditor
      v-if="config.advanced && showCode"
      height="200px"
      :init-values="model[name]"
      language="json"
      :options="{
        readOnly: disabled,
      }"
      :parse="true"
      @save="save"
    ></MagicCodeEditor>

    <TMagicButton
      v-if="config.advanced"
      size="default"
      :disabled="disabled"
      link
      :icon="CodeIcon"
      @click="showCode = !showCode"
    ></TMagicButton>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { Delete, Plus } from '@element-plus/icons-vue';

import { TMagicButton, TMagicInput } from '@tmagic/design';
import type { FieldProps, FormItem } from '@tmagic/form';

import CodeIcon from '@editor/icons/CodeIcon.vue';
import MagicCodeEditor from '@editor/layouts/CodeEditor.vue';

defineOptions({
  name: 'MFieldsKeyValue',
});

const props = withDefaults(
  defineProps<
    FieldProps<
      {
        type: 'key-value';
        advanced?: boolean;
      } & FormItem
    >
  >(),
  {
    disabled: false,
  },
);

const emit = defineEmits<(e: 'change', value: Record<string, any>) => void>();

const records = ref<[string, string][]>([]);
const showCode = ref(false);

watchEffect(() => {
  const initValues: [string, any][] = Object.entries(props.model[props.name] || {});

  for (const [, value] of initValues) {
    if (typeof value !== 'string') {
      showCode.value = true;
      break;
    }
  }

  records.value = initValues;
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
  emit('change', getValue());
};

const save = (v: string | any) => {
  emit('change', v);
};
</script>
