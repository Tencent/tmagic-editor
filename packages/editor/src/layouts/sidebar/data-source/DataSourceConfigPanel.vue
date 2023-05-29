<template>
  <TMagicDrawer
    v-model="visible"
    :title="title"
    :close-on-press-escape="true"
    :append-to-body="true"
    :show-close="true"
    :close-on-click-modal="true"
    :size="size"
  >
    <MForm ref="form" :config="dataSourceConfig" :init-values="initValues" @change="changeHandler"></MForm>

    <template #footer>
      <div>
        <TMagicButton type="primary" @click="submitHandler">确定</TMagicButton>
        <TMagicButton @click="hide">关闭</TMagicButton>
      </div>
    </template>
  </TMagicDrawer>
</template>

<script setup lang="ts">
import { computed, inject, ref, watchEffect } from 'vue';

import { TMagicButton, TMagicDrawer, tMagicMessage } from '@tmagic/design';
import { MForm } from '@tmagic/form';

import type { Services } from '@editor/type';

defineOptions({
  name: 'MEditorDataSourceConfigPanel',
});

const props = defineProps<{
  title?: string;
  values: any;
}>();

const type = ref('base');

const emit = defineEmits(['submit']);

const services = inject<Services>('services');

const size = computed(() => globalThis.document.body.clientWidth - (services?.uiService.get('columnWidth').left || 0));

const dataSourceConfig = computed(() => services?.dataSourceService.getFormConfig(type.value) || []);

const form = ref<InstanceType<typeof MForm>>();

const initValues = ref({});

watchEffect(() => {
  initValues.value = props.values;
  type.value = props.values.type || 'base';
});

const changeHandler = (value: Record<string, any>) => {
  if (value.type === type.value) {
    return;
  }
  type.value = value.type || 'base';
  initValues.value = value;
};

const submitHandler = async () => {
  try {
    const values = await form.value?.submitForm();
    emit('submit', values);
  } catch (error: any) {
    tMagicMessage.error(error.message);
  }
};

const visible = ref(false);

const hide = () => {
  visible.value = false;
};

defineExpose({
  show() {
    visible.value = true;
  },

  hide,
});
</script>
