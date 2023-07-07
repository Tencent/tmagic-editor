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
    <Teleport to="body">
      <ViewerMenu ref="menu" :is-multi-select="isMultiSelect" :stage-content-menu="stageContentMenu"></ViewerMenu>
    </Teleport>
  </ScrollViewer>
</template>

<script lang="ts" setup>
import { computed, inject, markRaw, nextTick, onMounted, onUnmounted, ref, toRaw, watch, watchEffect } from 'vue';
import { cloneDeep } from 'lodash-es';

import type { MContainer } from '@tmagic/schema';
import StageCore, { calcValueByFontsize, getOffset, Runtime } from '@tmagic/stage';

import ScrollViewer from '@editor/components/ScrollViewer.vue';
import { Layout, MenuButton, MenuComponent, Services, StageOptions } from '@editor/type';
import { getConfig } from '@editor/utils/config';
import { useStage } from '@editor/utils/stage';

import ViewerMenu from './ViewerMenu.vue';

defineOptions({
  name: 'MEditorStage',
});

defineProps<{
  stageContentMenu: (MenuButton | MenuComponent)[];
}>();

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

  stage?.mount(stageContainer.value);

  if (!node.value?.id) return;
  stage?.on('runtime-ready', (rt) => {
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

watch(root, (root) => {
  if (runtime && root) {
    runtime.updateRootConfig?.(cloneDeep(toRaw(root)));
  }
});

watch(page, (page) => {
  if (runtime && page) {
    runtime.updatePageId?.(page.id);
    nextTick(() => {
      stage?.select(page.id);
    });
  }
});

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
    services?.keybindingService.registeEl('stage', stageWrap.value.container);
  }
});

onUnmounted(() => {
  stage?.destroy();
  resizeObserver.disconnect();
  services?.editorService.set('stage', null);
  services?.keybindingService.unregisteEl('stage');
});

const contextmenuHandler = (e: MouseEvent) => {
  e.preventDefault();
  menu.value?.show(e);
};

const dragoverHandler = (e: DragEvent) => {
  e.preventDefault();
  if (!e.dataTransfer) return;
  e.dataTransfer.dropEffect = 'move';
};

const dropHandler = async (e: DragEvent) => {
  e.preventDefault();

  const doc = stage?.renderer.contentWindow?.document;
  const parentEl: HTMLElement | null | undefined = doc?.querySelector(`.${stageOptions?.containerHighlightClassName}`);

  let parent: MContainer | undefined | null = page.value;
  if (parentEl) {
    parent = services?.editorService.getNodeById(parentEl.id, false) as MContainer;
  }

  if (e.dataTransfer && parent && stageContainer.value && stage) {
    const parseDSL = getConfig('parseDSL');

    const data = e.dataTransfer.getData('text/json');

    if (!data) return;

    const config = parseDSL(`(${data})`);

    if (!config) return;

    const layout = await services?.editorService.getLayout(parent);

    const containerRect = stageContainer.value.getBoundingClientRect();
    const { scrollTop, scrollLeft } = stage.mask;
    const { style = {} } = config;

    let top = 0;
    let left = 0;
    let position = 'relative';

    if (layout === Layout.ABSOLUTE) {
      position = 'absolute';
      top = e.clientY - containerRect.top + scrollTop;
      left = e.clientX - containerRect.left + scrollLeft;

      if (parentEl && doc) {
        const { left: parentLeft, top: parentTop } = getOffset(parentEl);
        left = left - calcValueByFontsize(doc, parentLeft);
        top = top - calcValueByFontsize(doc, parentTop);
      }
    }

    config.style = {
      ...style,
      position,
      top: top / zoom.value,
      left: left / zoom.value,
    };

    config.inputEvent = e;

    services?.editorService.add(config, parent);
  }
};
</script>
