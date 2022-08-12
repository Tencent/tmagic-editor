<template>
  <scroll-viewer
    class="m-editor-stage"
    ref="stageWrap"
    :width="stageRect?.width"
    :height="stageRect?.height"
    :zoom="zoom"
  >
    <div
      class="m-editor-stage-container"
      ref="stageContainer"
      :style="`transform: scale(${zoom})`"
      @contextmenu="contextmenuHandler"
      @drop="dropHandler"
      @dragover="dragoverHandler"
    ></div>
    <teleport to="body">
      <viewer-menu ref="menu" :is-multi-select="isMultiSelect"></viewer-menu>
    </teleport>
  </scroll-viewer>
</template>

<script lang="ts" setup>
import { computed, inject, markRaw, onMounted, onUnmounted, ref, toRaw, watch, watchEffect } from 'vue';
import { cloneDeep } from 'lodash-es';

import type { MApp, MContainer, MNode, MPage } from '@tmagic/schema';
import StageCore, {
  calcValueByFontsize,
  getOffset,
  GuidesType,
  Runtime,
  SortEventData,
  UpdateEventData,
} from '@tmagic/stage';

import ScrollViewer from '../../components/ScrollViewer.vue';
import {
  H_GUIDE_LINE_STORAGE_KEY,
  Layout,
  Services,
  StageOptions,
  StageRect,
  V_GUIDE_LINE_STORAGE_KEY,
} from '../../type';
import { getGuideLineFromCache } from '../../utils';

import ViewerMenu from './ViewerMenu.vue';

let stage: StageCore | null = null;
let runtime: Runtime | null = null;

const services = inject<Services>('services');
const stageOptions = inject<StageOptions>('stageOptions');

const stageWrap = ref<InstanceType<typeof ScrollViewer>>();
const stageContainer = ref<HTMLDivElement>();
const menu = ref<InstanceType<typeof ViewerMenu>>();

const isMultiSelect = computed(() => services?.editorService.get('nodes')?.length > 1);
const stageRect = computed(() => services?.uiService.get<StageRect>('stageRect'));
const uiSelectMode = computed(() => services?.uiService.get<boolean>('uiSelectMode'));
const root = computed(() => services?.editorService.get<MApp>('root'));
const page = computed(() => services?.editorService.get<MPage>('page'));
const zoom = computed(() => services?.uiService.get<number>('zoom') || 1);
const node = computed(() => services?.editorService.get<MNode>('node'));

const getGuideLineKey = (key: string) => `${key}_${root.value?.id}_${page.value?.id}`;

watchEffect(() => {
  if (stage) return;

  if (!stageContainer.value) return;
  if (!(stageOptions?.runtimeUrl || stageOptions?.render) || !root.value) return;

  stage = new StageCore({
    render: stageOptions.render,
    runtimeUrl: stageOptions.runtimeUrl,
    zoom: zoom.value,
    autoScrollIntoView: stageOptions.autoScrollIntoView,
    isContainer: stageOptions.isContainer,
    containerHighlightClassName: stageOptions.containerHighlightClassName,
    containerHighlightDuration: stageOptions.containerHighlightDuration,
    containerHighlightType: stageOptions.containerHighlightType,
    canSelect: (el, event, stop) => {
      const elCanSelect = stageOptions.canSelect(el);
      // 在组件联动过程中不能再往下选择，返回并触发 ui-select
      if (uiSelectMode.value && elCanSelect && event.type === 'mousedown') {
        document.dispatchEvent(new CustomEvent('ui-select', { detail: el }));
        return stop();
      }

      return elCanSelect;
    },
    moveableOptions: stageOptions.moveableOptions,
    updateDragEl: stageOptions.updateDragEl,
  });

  services?.editorService.set('stage', markRaw(stage));

  stage?.mount(stageContainer.value);

  stage.mask.setGuides([
    getGuideLineFromCache(getGuideLineKey(H_GUIDE_LINE_STORAGE_KEY)),
    getGuideLineFromCache(getGuideLineKey(V_GUIDE_LINE_STORAGE_KEY)),
  ]);

  stage?.on('select', (el: HTMLElement) => {
    services?.editorService.select(el.id);
  });

  stage?.on('highlight', (el: HTMLElement) => {
    services?.editorService.highlight(el.id);
  });

  stage?.on('multiSelect', (els: HTMLElement[]) => {
    services?.editorService.multiSelect(els.map((el) => el.id));
  });

  stage?.on('update', (ev: UpdateEventData) => {
    if (ev.parentEl) {
      for (const data of ev.data) {
        services?.editorService.moveToContainer({ id: data.el.id, style: data.style }, ev.parentEl.id);
      }
      return;
    }

    services?.editorService.update(ev.data.map((data) => ({ id: data.el.id, style: data.style })));
  });

  stage?.on('sort', (ev: SortEventData) => {
    services?.editorService.sort(ev.src, ev.dist);
  });

  stage?.on('changeGuides', (e) => {
    services?.uiService.set('showGuides', true);

    if (!root.value || !page.value) return;

    const storageKey = getGuideLineKey(
      e.type === GuidesType.HORIZONTAL ? H_GUIDE_LINE_STORAGE_KEY : V_GUIDE_LINE_STORAGE_KEY,
    );
    if (e.guides.length) {
      globalThis.localStorage.setItem(storageKey, JSON.stringify(e.guides));
    } else {
      globalThis.localStorage.removeItem(storageKey);
    }
  });

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

const resizeObserver = new ResizeObserver((entries) => {
  for (const { contentRect } of entries) {
    services?.uiService.set('stageContainerRect', {
      width: contentRect.width,
      height: contentRect.height,
    });
  }
});

onMounted(() => {
  stageWrap.value?.container && resizeObserver.observe(stageWrap.value.container);
});

onUnmounted(() => {
  stage?.destroy();
  resizeObserver.disconnect();
  services?.editorService.set('stage', null);
});

const contextmenuHandler = (e: MouseEvent) => {
  e.preventDefault();
  menu.value?.show(e);
};

const dragoverHandler = (e: DragEvent) => {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
};

const dropHandler = async (e: DragEvent) => {
  e.preventDefault();

  const doc = stage?.renderer.contentWindow?.document;
  const parentEl: HTMLElement | null | undefined = doc?.querySelector(`.${stageOptions?.containerHighlightClassName}`);

  let parent: MContainer | undefined = page.value;
  if (parentEl) {
    parent = services?.editorService.getNodeById(parentEl.id, false) as MContainer;
  }

  if (e.dataTransfer && parent && stageContainer.value && stage) {
    // eslint-disable-next-line no-eval
    const config = eval(`(${e.dataTransfer.getData('data')})`);
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
      top,
      left,
    };

    config.inputEvent = e;

    services?.editorService.add(config, parent);
  }
};
</script>
