<template>
  <div class="m-fields-ui-select" v-if="uiSelectMode" @click="cancelHandler">
    <TMagicButton type="danger" :icon="Delete" text style="padding: 0">取消</TMagicButton>
  </div>
  <div class="m-fields-ui-select" v-else @click="startSelect" style="display: flex">
    <TMagicTooltip v-if="val" content="清除">
      <TMagicButton style="padding: 0" type="danger" :icon="Close" text @click.stop="deleteHandler"></TMagicButton>
    </TMagicTooltip>
    <TMagicTooltip :content="val ? toName + '_' + val : '点击此处选择'">
      <TMagicButton text style="padding: 0; margin: 0">{{ val ? toName + '_' + val : '点击此处选择' }}</TMagicButton>
    </TMagicTooltip>
  </div>
</template>

<script lang="ts" setup name="MEditorUISelect">
import { computed, inject, ref } from 'vue';
import { Close, Delete } from '@element-plus/icons-vue';

import { TMagicButton, TMagicTooltip } from '@tmagic/design';
import { FormState } from '@tmagic/form';

import type { Services } from '@editor/type';

const props = defineProps<{
  config: any;
  model: any;
  prop: string;
  name: string;
}>();

const emit = defineEmits(['change']);

const services = inject<Services>('services');
const mForm = inject<FormState>('mForm');
const val = computed(() => props.model[props.name]);
const uiSelectMode = ref(false);

const cancelHandler = () => {
  if (!services?.uiService) return;
  services.uiService.set('uiSelectMode', false);
  uiSelectMode.value = false;
  globalThis.document.removeEventListener('ui-select', clickHandler as EventListener);
};

const clickHandler = ({ detail }: Event & { detail: any }) => {
  if (detail.id) {
    props.model[props.name] = detail.id;
    emit('change', detail.id);
    mForm?.$emit('field-change', props.prop, detail.id);
  }

  if (cancelHandler) {
    cancelHandler();
  }
};

const toName = computed(() => {
  const config = services?.editorService.getNodeById(val.value);
  return config?.name || '';
});

const startSelect = () => {
  if (!services?.uiService) return;
  services.uiService.set('uiSelectMode', true);
  uiSelectMode.value = true;
  globalThis.document.addEventListener('ui-select', clickHandler as EventListener);
};

const deleteHandler = () => {
  if (props.model) {
    props.model[props.name] = '';
    emit('change', '');
    mForm?.$emit('field-change', props.prop, '');
  }
};
</script>

<style lang="scss">
.m-fields-ui-select {
  cursor: pointer;
  i {
    margin-right: 3px;
  }
  span {
    color: #2882e0;
  }
}
</style>
