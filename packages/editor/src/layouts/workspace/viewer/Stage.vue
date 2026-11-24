<template>
  <ScrollViewer
    class="m-editor-stage"
    ref="stageWrap"
    tabindex="-1"
    v-loading="stageLoading"
    element-loading-text="Runtime 加载中..."
    :width="stageRect?.width"
    :height="stageRect?.height"
    :wrap-width="stageContainerRect?.width"
    :wrap-height="stageContainerRect?.height"
    :zoom="zoom"
    :correction-scroll-size="{
      width: 60,
      height: 50,
    }"
    @click="stageWrapRef?.container?.focus()"
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

    <template #before>
      <slot name="stage-top"></slot>
    </template>

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
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, useTemplateRef, watch, watchEffect } from 'vue';

import type { MContainer } from '@tmagic/core';
import StageCore, { getOffset, Runtime } from '@tmagic/stage';
import { calcValueByFontsize, getIdFromEl } from '@tmagic/utils';

import ScrollViewer from '@editor/components/ScrollViewer.vue';
import { useServices } from '@editor/hooks';
import { useStage } from '@editor/hooks/use-stage';
import type {
  AddMNode,
  CustomContentMenuFunction,
  MenuButton,
  MenuComponent,
  StageOptions,
  StageSlots,
} from '@editor/type';
import { DragType, Layout } from '@editor/type';
import { getEditorConfig } from '@editor/utils/config';
import { KeyBindingContainerKey } from '@editor/utils/keybinding-config';

import NodeListMenu from './NodeListMenu.vue';
import StageOverlay from './StageOverlay.vue';
import ViewerMenu from './ViewerMenu.vue';

defineOptions({
  name: 'MEditorStage',
});

defineSlots<StageSlots>();

const props = withDefaults(
  defineProps<{
    stageOptions: StageOptions;
    stageContentMenu: (MenuButton | MenuComponent)[];
    disabledStageOverlay?: boolean;
    customContentMenu: CustomContentMenuFunction;
  }>(),
  {
    disabledStageOverlay: false,
  },
);

let stage: StageCore | null = null;
let runtime: Runtime | null = null;

const { editorService, uiService, keybindingService, stageOverlayService } = useServices();

const stageLoading = computed(() => editorService.get('stageLoading'));

const stageWrapRef = useTemplateRef<InstanceType<typeof ScrollViewer>>('stageWrap');
const stageContainerEl = useTemplateRef<HTMLDivElement>('stageContainer');
const menuRef = useTemplateRef<InstanceType<typeof ViewerMenu>>('menu');

const nodes = computed(() => editorService.get('nodes'));
const isMultiSelect = computed(() => nodes.value.length > 1);
const stageRect = computed(() => uiService.get('stageRect'));
const stageContainerRect = computed(() => uiService.get('stageContainerRect'));
const root = computed(() => editorService.get('root'));
const page = computed(() => editorService.get('page'));
const zoom = computed(() => uiService.get('zoom'));
const node = computed(() => editorService.get('node'));

/**
 * 双击选中进度：上次双击选中的节点 id
 *
 * 单击先于双击触发，会把当前选中重置到鼠标下最内层元素，
 * 所以层级的推进不能读当前选中状态，只能由双击自己记录。
 */
let lastDblclickSelectedId: string | undefined;

/**
 * 遍历鼠标位置下的元素链，找出「有子元素没显示全」的滚动容器
 *
 * 被裁掉的子元素不参与 elementsFromPoint 命中，无需找回它们：
 * 需要定位的是承载这些子元素的容器，交给 openOverlay 展开完整内容。
 * 可视区域以页面（页面片）为界：容器可视区与页面矩形求交后，
 * 只要有可选中子元素没完整落在该区域内，或容器内容本身就溢出了，
 * 这个容器就是需要展开的滚动容器。
 *
 * 轮播等组件靠内部样式完成裁剪，容器自身的 computed overflow 可能是 visible，
 * 因此不能拿 overflow 当门槛；openOverlay 也是按 scrollWidth/scrollHeight 展开，
 * 内容溢出本身就是最可靠的信号。
 * 页面自身是可视区域边界而不是滚动容器；iframe 级容器、以及 swiper-wrapper
 * 这类没有节点 id 的纯 DOM 包裹层也不参与，否则会抢在真正的容器前面。
 */
const findScrollContainer = (els: HTMLElement[]): HTMLElement | null => {
  const doc = stage?.renderer?.contentWindow?.document;
  const pageEl = stage?.mask?.page ?? doc?.querySelector<HTMLElement>('.magic-ui-page, .magic-ui-page-fragment');
  if (!pageEl) return null;

  const pageRect = pageEl.getBoundingClientRect();

  for (const el of els) {
    if (el === pageEl || !pageEl.contains(el) || !getIdFromEl()(el)) continue;

    const rect = el.getBoundingClientRect();
    const visibleLeft = Math.max(rect.left, pageRect.left);
    const visibleTop = Math.max(rect.top, pageRect.top);
    const visibleRight = Math.min(rect.right, pageRect.right);
    const visibleBottom = Math.min(rect.bottom, pageRect.bottom);

    // 轮播里未展示的 slide、超长列表等内容没落在容器里
    if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) return el;

    for (const child of el.querySelectorAll<HTMLElement>('*')) {
      if (!getIdFromEl()(child)) continue;
      const childRect = child.getBoundingClientRect();
      if (!childRect.width || !childRect.height) continue;
      if (
        childRect.left < visibleLeft ||
        childRect.top < visibleTop ||
        childRect.right > visibleRight ||
        childRect.bottom > visibleBottom
      ) {
        return el;
      }
    }
  }
  return null;
};

watchEffect(() => {
  if (stage || !page.value) return;

  if (!stageContainerEl.value) return;
  if (!(props.stageOptions?.runtimeUrl || props.stageOptions?.render) || !root.value) return;

  stage = useStage(props.stageOptions);

  stage.on('select', () => {
    stageWrapRef.value?.container?.focus();
  });

  stage.on('dblclick', async (event: MouseEvent) => {
    if (props.stageOptions.beforeDblclick) {
      const result = await props.stageOptions.beforeDblclick(event);
      if (result === false) return;
    }

    const el = (await stage?.actionManager?.getElementFromPoint(event)) || null;

    if (el) {
      const id = getIdFromEl()(el);
      if (id) {
        const node = editorService.getNodeById(id);
        if (node?.type === 'page-fragment-container' && node.pageFragmentId) {
          await editorService.select(node.pageFragmentId);
          return;
        }
      }
    }

    // 命中链只取一次：优先找需要展开的滚动容器，找不到再沿链向上选中
    const els = stage?.renderer?.getElementsFromPoint(event) ?? [];

    if (!props.disabledStageOverlay) {
      const scrollContainer = findScrollContainer(els);
      if (scrollContainer) {
        stageOverlayService.openOverlay(scrollContainer);
        return;
      }
    }

    if (!el) return;

    // 单击已把选中重置到链首，用上次双击选中的节点在链中的位置推进：
    // 连续双击即可从组件一路选中到页面；换了位置（链里找不到上次节点）或已经选到
    // 页面，则重新从父容器开始，保证每次双击都有选中反馈。
    const ids = els.map((item) => getIdFromEl()(item)).filter((id): id is string => Boolean(id));
    const lastIndex = lastDblclickSelectedId ? ids.indexOf(lastDblclickSelectedId) : -1;
    const nextIndex = lastIndex >= 0 && lastIndex + 1 < ids.length ? lastIndex + 1 : 1;
    const nextId = ids[nextIndex];
    if (!nextId) return;

    lastDblclickSelectedId = nextId;
    await editorService.select(nextId);
    editorService.get('stage')?.select(nextId);
  });

  editorService.set('stage', markRaw(stage));

  stage.mount(stageContainerEl.value);

  if (!node.value?.id) {
    return;
  }

  stage.on('runtime-ready', (rt) => {
    runtime = rt;
  });
});

onBeforeUnmount(() => {
  stage?.destroy();
  editorService.set('stage', null);
});

watch(zoom, (zoom) => {
  if (!stage || !zoom) return;
  stage.setZoom(zoom);
});

let timeoutId: ReturnType<typeof setTimeout> | null = null;
watch(page, (page) => {
  if (runtime && page) {
    editorService.set('stageLoading', true);

    if (timeoutId) {
      globalThis.clearTimeout(timeoutId);
    }

    timeoutId = globalThis.setTimeout(() => {
      editorService.set('stageLoading', false);
      timeoutId = null;
    }, 3000);

    runtime.updatePageId?.(page.id);

    const unWatch = watch(
      stageLoading,
      () => {
        if (stageLoading.value) {
          return;
        }

        nextTick(() => {
          stage?.select(page.id);
          unWatch();
        });
      },
      {
        immediate: true,
      },
    );
  }
});

const resizeObserver = new globalThis.ResizeObserver((entries) => {
  for (const { contentRect } of entries) {
    uiService.set('stageContainerRect', {
      width: contentRect.width,
      height: contentRect.height,
    });
  }
});

const parseDSL = getEditorConfig('parseDSL');

/**
 * 本次拖拽是否由编辑器文档内部发起
 *
 * drop 的 text/json 里可能带函数（组件配置的事件、钩子等），还原只能交给 parseDSL，
 * 而 parseDSL 的默认实现是 eval；HTML 拖放又允许其他源的页面在 DataTransfer 中投递
 * 自定义 MIME 数据，跨源页面只要诱导用户拖拽一次，就能让 eval 执行任意脚本。
 *
 * 跨源页面既不会在本文档触发 dragstart，也无法往本文档创建的 DataTransfer 中写数据，
 * 因此只有起源于本文档的拖拽才交给 parseDSL 还原。
 * 同源拖拽源写入的 text/json 由业务保证可信。
 */
let isInternalDrag = false;
let internalDragSession = 0;
let clearInternalDragTimer: ReturnType<typeof setTimeout> | undefined;

const documentDragStartHandler = () => {
  internalDragSession += 1;
  isInternalDrag = true;
  if (clearInternalDragTimer !== undefined) {
    globalThis.clearTimeout(clearInternalDragTimer);
    clearInternalDragTimer = undefined;
  }
};

const documentDragEndHandler = () => {
  // WebKit 可能先 dragend 再 drop；推迟到下一个宏任务再清标志，
  // 让同一次拖拽的 drop 仍能消费。session 防止误清掉下一次 dragstart。
  const session = internalDragSession;
  if (clearInternalDragTimer !== undefined) {
    globalThis.clearTimeout(clearInternalDragTimer);
  }
  clearInternalDragTimer = globalThis.setTimeout(() => {
    clearInternalDragTimer = undefined;
    if (session === internalDragSession) {
      isInternalDrag = false;
    }
  }, 0);
};

onMounted(() => {
  if (stageWrapRef.value?.container) {
    resizeObserver.observe(stageWrapRef.value.container);
    keybindingService.registerEl(KeyBindingContainerKey.STAGE, stageWrapRef.value.container);
  }

  // 用捕获阶段监听，确保拖拽源自身的 dragstart 无论是否阻止冒泡都能被记录
  globalThis.document.addEventListener('dragstart', documentDragStartHandler, true);
  globalThis.document.addEventListener('dragend', documentDragEndHandler, true);
});

onBeforeUnmount(() => {
  stage?.destroy();
  stage = null;
  resizeObserver.disconnect();
  editorService.set('stage', null);
  keybindingService.unregisterEl('stage');

  if (clearInternalDragTimer !== undefined) {
    globalThis.clearTimeout(clearInternalDragTimer);
    clearInternalDragTimer = undefined;
  }

  globalThis.document.removeEventListener('dragstart', documentDragStartHandler, true);
  globalThis.document.removeEventListener('dragend', documentDragEndHandler, true);
});

const contextmenuHandler = (e: MouseEvent) => {
  e.preventDefault();
  menuRef.value?.show(e);
};

const dragoverHandler = (e: DragEvent) => {
  if (!e.dataTransfer) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

const dropHandler = async (e: DragEvent) => {
  // 画布上的任意 drop 都消费本次内部拖拽标记（含空 text/json），避免残留到下一次 drop
  const allowed = isInternalDrag;
  isInternalDrag = false;

  if (!e.dataTransfer) return;

  const data = e.dataTransfer.getData('text/json');

  // 外部源投递的拖拽数据不可信，不能交给 parseDSL(默认实现为 eval)
  if (!data || !allowed) return;

  let config: { dragType?: string; data?: AddMNode } | undefined;
  try {
    config = parseDSL(`(${data})`);
  } catch {
    return;
  }

  if (!config || config.dragType !== DragType.COMPONENT_LIST || !config.data) return;

  const dragData = config.data;

  e.preventDefault();

  const doc = stage?.renderer?.contentWindow?.document;
  const parentEl: HTMLElement | null | undefined = doc?.querySelector(
    `.${props.stageOptions?.containerHighlightClassName}`,
  );

  let parent: MContainer | undefined | null = page.value;
  let resolvedParentEl: HTMLElement | null | undefined = parentEl;
  const parentId = getIdFromEl()(parentEl);
  if (parentId) {
    parent = editorService.getNodeById(parentId, false) as MContainer;
  }

  if (parent && stageContainerEl.value && stage) {
    // 通过用户配置的钩子再次确认当前拖入的新组件是否允许放入命中的高亮容器，
    // 防止 delayedMarkContainer 的延迟/异步未生效或残留高亮导致命中错误容器
    //   - 返回 false：取消此次拖入
    //   - 返回 Id  ：将父节点重定向到该 id 对应的节点（layout 坐标也基于其 DOM 重新计算）
    //   - 其他    ：使用原命中节点
    // 从组件列表拖入新组件时 sourceIds 为空数组（尚无 id）
    if (props.stageOptions.canDropIn) {
      const result = props.stageOptions.canDropIn([], parent.id);
      if (result === false) {
        return;
      }
      if (typeof result === 'string' || typeof result === 'number') {
        const redirectedNode = editorService.getNodeById(result, false) as MContainer | undefined;
        if (!redirectedNode) {
          return;
        }
        parent = redirectedNode;
        resolvedParentEl = stage.renderer?.getTargetElement(result) ?? null;
      }
    }

    const layout = await editorService.getLayout(parent);

    const containerRect = stageContainerEl.value.getBoundingClientRect();
    const { scrollTop, scrollLeft } = stage.mask!;
    const { style = {} } = dragData;

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

      if (resolvedParentEl) {
        const { left: parentLeft, top: parentTop } = getOffset(resolvedParentEl);
        left = left - parentLeft * zoom.value;
        top = top - parentTop * zoom.value;
      }
    }

    dragData.style = {
      ...style,
      position,
      top: calcValueByFontsize(doc, top / zoom.value),
      left: calcValueByFontsize(doc, left / zoom.value),
    };

    dragData.inputEvent = e;

    if (props.stageOptions.beforeDropComponent) {
      const result = await props.stageOptions.beforeDropComponent(dragData, parent);
      if (result === false) return;
    }

    editorService.add(dragData, parent, { historySource: 'component-panel' });
  }
};
</script>
