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
      @submit="(v, eventData, error) => submit(v, eventData, error, 'props')"
      @submit-error="errorHandler"
      @form-error="errorHandler"
      @mounted="mountedHandler"
      @unmounted="unmountedHandler"
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
      @submit="(v, eventData, error) => submit(v, eventData, error, 'style')"
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
import { computed, inject, onBeforeUnmount, onMounted, ref, useTemplateRef, watch, watchEffect } from 'vue';
import { Close, Sugar } from '@element-plus/icons-vue';
import type { OnDrag } from 'gesto';

import { type MNode } from '@tmagic/core';
import { TMagicButton } from '@tmagic/design';
import type { ContainerChangeEventData, FormState, FormValue } from '@tmagic/form';
import { setValueByKeyPath } from '@tmagic/utils';

import MIcon from '@editor/components/Icon.vue';
import Resizer from '@editor/components/Resizer.vue';
import { ENABLE_PROPS_FORM_VALIDATE } from '@editor/editorProps';
import { useServices } from '@editor/hooks/use-services';
import { Protocol } from '@editor/services/storage';
import type { NodeInvalidSource, PropsPanelSlots } from '@editor/type';
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
  unmounted: [];
}>();

const { editorService, uiService, propsService, storageService } = useServices();

const enablePropsFormValidate = inject(ENABLE_PROPS_FORM_VALIDATE, false);

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

// 用单调递增序号标记每次 init 调用，只让"最新一次"的 await 结果落到 ref 上。
// 避免节点快速切换时多个 init 并发 + 解析顺序错乱导致 stale config 覆盖最新选中节点，
// 以及组件已卸载 / FormPanel 正在 remount 的中间态下写 ref 触发 Vue setRef 把 __vnode
// 设到 null 上的报错（TypeError: Cannot set properties of null (setting '__vnode')）。
let initSeq = 0;
let mounted = true;

const init = async () => {
  initSeq += 1;
  const seq = initSeq;

  if (!node.value) {
    if (seq !== initSeq || !mounted) return;
    curFormConfig.value = [];
    return;
  }

  const type = node.value.type || (node.value.items ? 'container' : 'text');
  const config = await propsService.getPropsConfig(type, { node: node.value });

  // 期间被新一次 init 取代 / 组件已卸载，丢弃本次结果
  if (seq !== initSeq || !mounted) return;
  if (!node.value) return;

  curFormConfig.value = config;
  values.value = node.value;
};

watchEffect(init);
propsService.on('props-configs-change', init);

onBeforeUnmount(() => {
  mounted = false;
  propsService.off('props-configs-change', init);
});

const submit = async (
  v: MNode,
  eventData?: ContainerChangeEventData,
  error?: any,
  source: NodeInvalidSource = 'props',
) => {
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

    // 区分操作途径：表单字段编辑（MForm @change）会带上 eventData（含 changeRecords）；
    // 源码编辑器（CodeEditor @save → saveCode）保存时不带 eventData，据此标记为「源码编辑器」。
    const historySource = eventData ? 'props' : 'code';

    editorService.update(newValue, {
      changeRecords: eventData?.changeRecords,
      historySource,
      // 启用校验联动时，仅校验失败（error 存在）才把错误信息随更新传入 editorService 记录；
      // 其余情况（含表单校验成功、CodeEditor 源码保存）不携带 invalidInfo，由 editorService 在执行 update 时统一清除该节点错误。
      ...(enablePropsFormValidate && error ? { invalidInfo: { id: newValue.id, source, error: error?.message } } : {}),
    });
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

const unmountedHandler = () => {
  emit('unmounted');
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
