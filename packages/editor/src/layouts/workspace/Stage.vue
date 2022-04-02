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
      @contextmenu="contextmenuHandler"
      :style="`transform: scale(${zoom})`"
    ></div>
    <teleport to="body">
      <viewer-menu ref="menu" :style="menuStyle"></viewer-menu>
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
import type { Services, StageRect } from '@editor/type';

import ViewerMenu from './ViewerMenu.vue';

const useMenu = () => {
  const menu = ref<InstanceType<typeof ViewerMenu>>();
  const menuStyle = ref({
    display: 'none',
    left: '0',
    top: '0',
  });

  onMounted(() => {
    document.addEventListener(
      'click',
      () => {
        menuStyle.value.display = 'none';
      },
      true,
    );
  });

  return {
    menu,
    menuStyle,

    contextmenuHandler(e: MouseEvent) {
      e.preventDefault();

      const menuHeight = menu.value?.$el.clientHeight;
      let top = e.clientY;
      if (menuHeight + e.clientY > document.body.clientHeight) {
        top = document.body.clientHeight - menuHeight;
      }
      menuStyle.value = {
        display: 'block',
        top: `${top}px`,
        left: `${e.clientX}px`,
      };
    },
  };
};

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

  emits: ['select', 'update', 'sort', 'highlight'],

  setup(props, { emit }) {
    const services = inject<Services>('services');

    const stageWrap = ref<InstanceType<typeof ScrollViewer>>();
    const stageContainer = ref<HTMLDivElement>();

    const stageRect = computed(() => services?.uiService.get<StageRect>('stageRect'));
    const uiSelectMode = computed(() => services?.uiService.get<boolean>('uiSelectMode'));
    const root = computed(() => services?.editorService.get<MApp>('root'));
    const page = computed(() => services?.editorService.get<MPage>('page'));
    const zoom = computed(() => services?.uiService.get<number>('zoom'));
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
        emit('select', el);
      });

      stage?.on('highlight', (el: HTMLElement) => {
        emit('highlight', el);
      });

      stage?.on('update', (ev: UpdateEventData) => {
        emit('update', { id: ev.el.id, style: ev.style });
      });

      stage?.on('sort', (ev: SortEventData) => {
        emit('sort', ev);
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
      stageRect,
      zoom,
      ...useMenu(),
    };
  },
});
</script>
