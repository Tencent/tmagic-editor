<template>
  <ScrollViewer
    class="m-editor-stage"
    ref="stageWrap"
    tabindex="-1"
    :width="stageRect?.width"
    :height="stageRect?.height"
    :wrap-width="stageContainerRect?.width"
    :wrap-height="stageContainerRect?.height"
    :zoom="zoom"
    :correction-scroll-size="{
      width: 60,
      height: 50,
    }"
    @click="stageWrap?.container?.focus()"
  >
    <div
      class="m-editor-stage-container"
      ref="stageContainer"
      :style="`transform: scale(${zoom});`"
      @contextmenu="contextmenuHandler"
      @drop="dropHandler"
      @dragover="dragoverHandler"
    ></div>

    <NodeListMenu></NodeListMenu>

    <template #content>
      <StageOverlay v-if="!disabledStageOverlay"></StageOverlay>

      <Teleport to="body">
        <ViewerMenu
          ref="menu"
          :is-multi-select="isMultiSelect"
          :stage-content-menu="stageContentMenu"
          :custom-content-menu="customContentMenu"
        ></ViewerMenu>
      </Teleport>
    </template>
  </ScrollViewer>
</template>

<script lang="ts" setup>
import { computed, inject, markRaw, nextTick, onBeforeUnmount, onMounted, ref, toRaw, watch, watchEffect } from 'vue';
import { cloneDeep } from 'lodash-es';

import type { MApp, MContainer } from '@tmagic/schema';
import StageCore, { calcValueByFontsize, getOffset, Runtime } from '@tmagic/stage';

import ScrollViewer from '@editor/components/ScrollViewer.vue';
import { useStage } from '@editor/hooks/use-stage';
import { DragType, Layout, type MenuButton, type MenuComponent, type Services, type StageOptions } from '@editor/type';
import { getConfig } from '@editor/utils/config';
import { KeyBindingContainerKey } from '@editor/utils/keybinding-config';

import NodeListMenu from './NodeListMenu.vue';
import StageOverlay from './StageOverlay.vue';
import ViewerMenu from './ViewerMenu.vue';

defineOptions({
  name: 'MEditorStage',
});

withDefaults(
  defineProps<{
    stageContentMenu: (MenuButton | MenuComponent)[];
    disabledStageOverlay?: boolean;
    customContentMenu?: (menus: (MenuButton | MenuComponent)[], type: string) => (MenuButton | MenuComponent)[];
  }>(),
  {
    disabledStageOverlay: false,
  },
);

let stage: StageCore | null = null;
let runtime: Runtime | null = null;

const services = inject<Services>('services');
const stageOptions = inject<StageOptions>('stageOptions');

const stageWrap = ref<InstanceType<typeof ScrollViewer>>();
const stageContainer = ref<HTMLDivElement>();
const menu = ref<InstanceType<typeof ViewerMenu>>();

const nodes = computed(() => services?.editorService.get('nodes') || []);
const isMultiSelect = computed(() => nodes.value.length > 1);
const stageRect = computed(() => services?.uiService.get('stageRect'));
const stageContainerRect = computed(() => services?.uiService.get('stageContainerRect'));
const root = computed(() => services?.editorService.get('root'));
const page = computed(() => services?.editorService.get('page'));
const zoom = computed(() => services?.uiService.get('zoom') || 1);
const node = computed(() => services?.editorService.get('node'));

watchEffect(() => {
  if (stage || !page.value) return;

  if (!stageContainer.value) return;
  if (!(stageOptions?.runtimeUrl || stageOptions?.render) || !root.value) return;

  stage = useStage(stageOptions);

  stage.on('select', () => {
    stageWrap.value?.container?.focus();
  });

  services?.editorService.set('stage', markRaw(stage));

  stage.mount(stageContainer.value);

  if (!node.value?.id) {
    return;
  }

  stage.on('runtime-ready', (rt) => {
    runtime = rt;
    // toRaw返回的值是一个引用而非快照，需要cloneDeep
    root.value && runtime?.updateRootConfig?.(cloneDeep(toRaw(root.value)));
    page.value?.id && runtime?.updatePageId?.(page.value.id);
    setTimeout(() => {
      node.value && stage?.select(toRaw(node.value.id));
    });
  });
});

watch(zoom, (zoom) => {
  if (!stage || !zoom) return;
  stage.setZoom(zoom);
});

watch(page, (page) => {
  if (runtime && page) {
    services?.editorService.set('stageLoading', true);
    runtime.updatePageId?.(page.id);
    nextTick(() => {
      stage?.select(page.id);
    });
  }
});

const rootChangeHandler = (root: MApp) => {
  if (runtime && root) {
    runtime.updateRootConfig?.(cloneDeep(toRaw(root)));
  }
};

services?.editorService.on('root-change', rootChangeHandler);

const resizeObserver = new ResizeObserver((entries) => {
  for (const { contentRect } of entries) {
    services?.uiService.set('stageContainerRect', {
      width: contentRect.width,
      height: contentRect.height,
    });
  }
});

onMounted(() => {
  if (stageWrap.value?.container) {
    resizeObserver.observe(stageWrap.value.container);
    services?.keybindingService.registerEl(KeyBindingContainerKey.STAGE, stageWrap.value.container);
  }
});

onBeforeUnmount(() => {
  stage?.destroy();
  resizeObserver.disconnect();
  services?.editorService.set('stage', null);
  services?.keybindingService.unregisterEl('stage');
  services?.editorService.off('root-change', rootChangeHandler);
});

const parseDSL = getConfig('parseDSL');

const contextmenuHandler = (e: MouseEvent) => {
  e.preventDefault();
  menu.value?.show(e);
};

const dragoverHandler = (e: DragEvent) => {
  if (!e.dataTransfer) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

const dropHandler = async (e: DragEvent) => {
  if (!e.dataTransfer) return;

  const data = e.dataTransfer.getData('text/json');

  if (!data) return;

  const config = parseDSL(`(${data})`);

  if (!config || config.dragType !== DragType.COMPONENT_LIST) return;

  e.preventDefault();

  const doc = stage?.renderer.contentWindow?.document;
  const parentEl: HTMLElement | null | undefined = doc?.querySelector(`.${stageOptions?.containerHighlightClassName}`);

  let parent: MContainer | undefined | null = page.value;
  if (parentEl) {
    parent = services?.editorService.getNodeById(parentEl.id, false) as MContainer;
  }

  if (parent && stageContainer.value && stage) {
    const layout = await services?.editorService.getLayout(parent);

    const containerRect = stageContainer.value.getBoundingClientRect();
    const { scrollTop, scrollLeft } = stage.mask;
    const { style = {} } = config.data;

    let top = 0;
    let left = 0;
    let position = 'relative';

    if (style.position === 'fixed') {
      position = 'fixed';
      top = e.clientY - containerRect.top;
      left = e.clientX - containerRect.left;
    } else if (layout === Layout.ABSOLUTE) {
      position = 'absolute';
      top = e.clientY - containerRect.top + scrollTop;
      left = e.clientX - containerRect.left + scrollLeft;

      if (parentEl && doc) {
        const { left: parentLeft, top: parentTop } = getOffset(parentEl);
        left = left - calcValueByFontsize(doc, parentLeft) * zoom.value;
        top = top - calcValueByFontsize(doc, parentTop) * zoom.value;
      }
    }

    config.data.style = {
      ...style,
      position,
      top: top / zoom.value,
      left: left / zoom.value,
    };

    config.data.inputEvent = e;

    services?.editorService.add(config.data, parent);
  }
};
</script>
