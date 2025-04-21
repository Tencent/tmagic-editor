<template>
  <div ref="propsPanel" class="m-editor-props-panel" v-show="nodes.length === 1">
    <slot name="props-panel-header"></slot>
    <FormPanel
      ref="propertyFormPanel"
      class="m-editor-props-property-panel"
      :class="{ 'show-style-panel': showStylePanel }"
      :config="curFormConfig"
      :values="values"
      :disabledShowSrc="disabledShowSrc"
      :extendState="extendState"
      @submit="submit"
      @submit-error="errorHandler"
      @form-error="errorHandler"
      @mounted="mountedHandler"
    ></FormPanel>

    <Resizer v-if="showStylePanel" @change="widthChange"></Resizer>

    <FormPanel
      v-if="showStylePanel"
      class="m-editor-props-style-panel"
      label-position="top"
      code-value-key="style"
      :config="styleFormConfig"
      :values="values"
      :disabledShowSrc="disabledShowSrc"
      :extendState="extendState"
      @submit="submit"
      @submit-error="errorHandler"
      @form-error="errorHandler"
    >
      <template #props-form-panel-header>
        <div class="m-editor-props-style-panel-title">
          <span>样式</span>
          <div>
            <TMagicButton link size="small" @click="toggleStylePanel(false)"
              ><MIcon :icon="Close"></MIcon
            ></TMagicButton>
          </div>
        </div>
      </template>
    </FormPanel>

    <TMagicButton
      v-if="showStylePanelToggleButton && !showStylePanel"
      class="m-editor-props-panel-style-icon"
      circle
      @click="toggleStylePanel(true)"
    >
      <MIcon :icon="Sugar"></MIcon>
    </TMagicButton>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch, watchEffect } from 'vue';
import { Close, Sugar } from '@element-plus/icons-vue';
import type { OnDrag } from 'gesto';

import { type MNode } from '@tmagic/core';
import { TMagicButton } from '@tmagic/design';
import type { ContainerChangeEventData, FormState, FormValue } from '@tmagic/form';
import { setValueByKeyPath } from '@tmagic/utils';

import MIcon from '@editor/components/Icon.vue';
import Resizer from '@editor/components/Resizer.vue';
import { useServices } from '@editor/hooks/use-services';
import { Protocol } from '@editor/services/storage';
import type { PropsPanelSlots } from '@editor/type';
import { styleTabConfig } from '@editor/utils';
import { PROPS_PANEL_WIDTH_STORAGE_KEY } from '@editor/utils/const';

import FormPanel from './FormPanel.vue';
import { useStylePanel } from './use-style-panel';

defineSlots<PropsPanelSlots>();

defineOptions({
  name: 'MEditorPropsPanel',
});

defineProps<{
  disabledShowSrc?: boolean;
  extendState?: (_state: FormState) => Record<string, any> | Promise<Record<string, any>>;
}>();

const emit = defineEmits<{
  'submit-error': [e: any];
  'form-error': [e: any];
  mounted: [internalInstance: InstanceType<typeof FormPanel>];
}>();

const { editorService, uiService, propsService, storageService } = useServices();

const values = ref<FormValue>({});
// ts类型应该是FormConfig， 但是打包时会出错，所以暂时用any
const curFormConfig = ref<any>([]);
const node = computed(() => editorService.get('node'));
const nodes = computed(() => editorService.get('nodes'));

const styleFormConfig = [
  {
    tabPosition: 'right',
    items: styleTabConfig.items,
  },
];

const init = async () => {
  if (!node.value) {
    curFormConfig.value = [];
    return;
  }

  const type = node.value.type || (node.value.items ? 'container' : 'text');
  curFormConfig.value = await propsService.getPropsConfig(type);
  values.value = node.value;
};

watchEffect(init);
propsService.on('props-configs-change', init);

onBeforeUnmount(() => {
  propsService.off('props-configs-change', init);
});

const submit = async (v: MNode, eventData?: ContainerChangeEventData) => {
  try {
    if (!v.id) {
      v.id = values.value.id;
    }

    const newValue: MNode = {
      ...v,
      style: {},
    };

    if (v.style) {
      Object.entries(v.style).forEach(([key, value]) => {
        if (value !== '' && newValue.style) {
          newValue.style[key] = value;
        }
      });

      eventData?.changeRecords?.forEach((record) => {
        if (record.propPath?.startsWith('style') && record.value === '') {
          setValueByKeyPath(record.propPath, record.value, newValue);
        }
      });
    }

    editorService.update(newValue, { changeRecords: eventData?.changeRecords });
  } catch (e: any) {
    emit('submit-error', e);
  }
};

const errorHandler = (e: any) => {
  emit('form-error', e);
};

const mountedHandler = () => {
  if (propertyFormPanelRef.value) {
    emit('mounted', propertyFormPanelRef.value);
  }
};

const propsPanelEl = useTemplateRef('propsPanel');
const propsPanelWidth = ref(
  storageService.getItem(PROPS_PANEL_WIDTH_STORAGE_KEY, { protocol: Protocol.NUMBER }) || 300,
);

onMounted(() => {
  propsPanelEl.value?.style.setProperty('--props-style-panel-width', `${Math.max(propsPanelWidth.value, 0)}px`);
});

const widthChange = ({ deltaX }: OnDrag) => {
  if (!propsPanelEl.value) {
    return;
  }

  const width = globalThis.parseFloat(
    getComputedStyle(propsPanelEl.value).getPropertyValue('--props-style-panel-width'),
  );

  let value = width - deltaX;
  if (value > uiService.get('columnWidth').right) {
    value = uiService.get('columnWidth').right - 40;
  }
  propsPanelWidth.value = Math.max(value, 0);
};

watch(propsPanelWidth, (value) => {
  propsPanelEl.value?.style.setProperty('--props-style-panel-width', `${value}px`);
  storageService.setItem(PROPS_PANEL_WIDTH_STORAGE_KEY, value, { protocol: Protocol.NUMBER });
});

const { showStylePanel, showStylePanelToggleButton, toggleStylePanel } = useStylePanel(
  {
    storageService,
    uiService,
  },
  propsPanelWidth,
);

const propertyFormPanelRef = useTemplateRef<InstanceType<typeof FormPanel>>('propertyFormPanel');
defineExpose({
  getFormState() {
    return propertyFormPanelRef.value?.configForm?.formState;
  },
  submit,
});
</script>
