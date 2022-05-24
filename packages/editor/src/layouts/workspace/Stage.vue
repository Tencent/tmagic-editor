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
      <viewer-menu ref="menu"></viewer-menu>
    </teleport>
  </scroll-viewer>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  inject,
  markRaw,
  onMounted,
  onUnmounted,
  PropType,
  ref,
  toRaw,
  watch,
  watchEffect,
} from 'vue';
import { cloneDeep } from 'lodash-es';

import type { MApp, MNode, MPage } from '@tmagic/schema';
import type { MoveableOptions, Runtime, SortEventData, UpdateEventData } from '@tmagic/stage';
import StageCore from '@tmagic/stage';

import ScrollViewer from '@editor/components/ScrollViewer.vue';
import { Layout, Services, StageRect } from '@editor/type';

import ViewerMenu from './ViewerMenu.vue';

export default defineComponent({
  name: 'magic-stage',

  components: {
    ViewerMenu,
    ScrollViewer,
  },

  props: {
    render: {
      type: Function as PropType<() => HTMLDivElement>,
    },

    runtimeUrl: String,

    canSelect: {
      type: Function as PropType<(el: HTMLElement) => boolean | Promise<boolean>>,
      default: (el: HTMLElement) => Boolean(el.id),
    },

    moveableOptions: {
      type: [Object, Function] as PropType<MoveableOptions | ((core?: StageCore) => MoveableOptions)>,
      default: () => (core?: StageCore) => ({
        container: core?.renderer?.contentWindow?.document.getElementById('app'),
      }),
    },
  },

  setup(props) {
    const services = inject<Services>('services');

    const stageWrap = ref<InstanceType<typeof ScrollViewer>>();
    const stageContainer = ref<HTMLDivElement>();
    const menu = ref<InstanceType<typeof ViewerMenu>>();

    const stageRect = computed(() => services?.uiService.get<StageRect>('stageRect'));
    const uiSelectMode = computed(() => services?.uiService.get<boolean>('uiSelectMode'));
    const root = computed(() => services?.editorService.get<MApp>('root'));
    const page = computed(() => services?.editorService.get<MPage>('page'));
    const zoom = computed(() => services?.uiService.get<number>('zoom') || 1);
    const node = computed(() => services?.editorService.get<MNode>('node'));

    let stage: StageCore | null = null;
    let runtime: Runtime | null = null;

    watchEffect(() => {
      if (stage) return;

      if (!stageContainer.value) return;
      if (!(props.runtimeUrl || props.render) || !root.value) return;

      stage = new StageCore({
        render: props.render,
        runtimeUrl: props.runtimeUrl,
        zoom: zoom.value,
        canSelect: (el, event, stop) => {
          const elCanSelect = props.canSelect(el);
          // 在组件联动过程中不能再往下选择，返回并触发 ui-select
          if (uiSelectMode.value && elCanSelect && event.type === 'mousedown') {
            document.dispatchEvent(new CustomEvent('ui-select', { detail: el }));
            return stop();
          }

          return elCanSelect;
        },
        moveableOptions: props.moveableOptions,
      });

      services?.editorService.set('stage', markRaw(stage));

      stage?.mount(stageContainer.value);

      stage?.on('select', (el: HTMLElement) => {
        services?.editorService.select(el.id);
      });

      stage?.on('highlight', (el: HTMLElement) => {
        services?.editorService.highlight(el.id);
      });

      stage?.on('update', (ev: UpdateEventData) => {
        services?.editorService.update({ id: ev.el.id, style: ev.style });
      });

      stage?.on('sort', (ev: SortEventData) => {
        services?.editorService.sort(ev.src, ev.dist);
      });

      stage?.on('changeGuides', () => {
        services?.uiService.set('showGuides', true);
      });

      if (!node.value?.id) return;
      stage?.on('runtime-ready', (rt) => {
        runtime = rt;
        // toRaw返回的值是一个引用而非快照，需要cloneDeep
        root.value && runtime?.updateRootConfig(cloneDeep(toRaw(root.value)));
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
        runtime.updateRootConfig(cloneDeep(toRaw(root)));
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

    return {
      stageWrap,
      stageContainer,
      menu,
      stageRect,
      zoom,

      contextmenuHandler(e: MouseEvent) {
        e.preventDefault();
        menu.value?.show(e);
      },

      dragoverHandler(e: DragEvent) {
        e.preventDefault();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'move';
        }
      },

      async dropHandler(e: DragEvent) {
        e.preventDefault();
        if (e.dataTransfer && page.value && stageContainer.value && stage) {
          // eslint-disable-next-line no-eval
          const config = eval(`(${e.dataTransfer.getData('data')})`);
          const layout = await services?.editorService.getLayout(page.value);

          const containerRect = stageContainer.value.getBoundingClientRect();
          const { scrollTop, scrollLeft } = stage.mask;
          if (layout === Layout.ABSOLUTE) {
            config.style = {
              ...(config.style || {}),
              position: 'absolute',
              top: e.clientY - containerRect.top + scrollTop,
              left: e.clientX - containerRect.left + scrollLeft,
            };
          }

          services?.editorService.add(config, page.value);
        }
      },
    };
  },
});
</script>
