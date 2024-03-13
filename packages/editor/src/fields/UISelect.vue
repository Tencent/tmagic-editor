<template>
  <div class="m-fields-ui-select" v-if="uiSelectMode" @click="cancelHandler">
    <TMagicButton type="danger" :icon="Delete" :disabled="disabled" :size="size" link style="padding: 0"
      >取消</TMagicButton
    >
  </div>
  <div class="m-fields-ui-select" v-else style="display: flex">
    <template v-if="val">
      <TMagicTooltip content="清除" placement="top">
        <TMagicButton
          style="padding: 0"
          type="danger"
          :icon="Close"
          :disabled="disabled"
          :size="size"
          link
          @click.stop="deleteHandler"
        ></TMagicButton>
      </TMagicTooltip>

      <TMagicTooltip content="点击选中组件" placement="top">
        <TMagicButton
          link
          style="padding: 0; margin: 0"
          :disabled="disabled"
          :size="size"
          @click="selectNode(val)"
          @mouseenter="highlight(val)"
          @mouseleave="unhighlight"
          >{{ `${toName}_${val}` }}</TMagicButton
        >
      </TMagicTooltip>
    </template>

    <TMagicTooltip v-else content="点击此处选择" placement="top">
      <TMagicButton link style="padding: 0; margin: 0" :disabled="disabled" :size="size" @click="startSelect"
        >点击此处选择</TMagicButton
      >
    </TMagicTooltip>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import { Close, Delete } from '@element-plus/icons-vue';
import { throttle } from 'lodash-es';

import { TMagicButton, TMagicTooltip } from '@tmagic/design';
import type { FieldProps, FormItem, FormState } from '@tmagic/form';
import type { Id } from '@tmagic/schema';

import { Services, UI_SELECT_MODE_EVENT_NAME } from '@editor/type';

defineOptions({
  name: 'MFieldsUISelect',
});

const props = defineProps<FieldProps<{ type: 'ui-select' } & FormItem>>();

const emit = defineEmits(['change']);

const services = inject<Services>('services');
const mForm = inject<FormState>('mForm');
const val = computed(() => props.model[props.name]);
const uiSelectMode = ref(false);

const cancelHandler = () => {
  if (!services?.uiService) return;
  services.uiService.set('uiSelectMode', false);
  uiSelectMode.value = false;
  globalThis.document.removeEventListener(UI_SELECT_MODE_EVENT_NAME, clickHandler as EventListener);
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
  globalThis.document.addEventListener(UI_SELECT_MODE_EVENT_NAME, clickHandler as EventListener);
};

const deleteHandler = () => {
  if (props.model) {
    props.model[props.name] = '';
    emit('change', '');
    mForm?.$emit('field-change', props.prop, '');
  }
};

const selectNode = async (id: Id) => {
  await services?.editorService.select(id);
  services?.editorService.get('stage')?.select(id);
  services?.stageOverlayService.get('stage')?.select(id);
};

const highlight = throttle((id: Id) => {
  services?.editorService.highlight(id);
  services?.editorService.get('stage')?.highlight(id);
  services?.stageOverlayService.get('stage')?.highlight(id);
}, 150);

const unhighlight = () => {
  services?.editorService.set('highlightNode', null);
  services?.editorService.get('stage')?.clearHighlight();
  services?.stageOverlayService.get('stage')?.clearHighlight();
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
