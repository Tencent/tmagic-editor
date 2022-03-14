<template>
  <div class="m-editor-stage" ref="stageWrap">
    <div
      class="m-editor-stage-container"
      ref="stageContainer"
      :style="stageStyle"
      @contextmenu="contextmenuHandler"
    ></div>
    <teleport to="body">
      <viewer-menu ref="menu" :style="menuStyle"></viewer-menu>
    </teleport>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  inject,
  nextTick,
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

  emits: ['select', 'update', 'sort'],

  setup(props, { emit }) {
    const services = inject<Services>('services');

    const stageWrap = ref<HTMLDivElement>();
    const stageContainer = ref<HTMLDivElement>();

    const stageRect = computed(() => services?.uiService.get<StageRect>('stageRect'));
    const uiSelectMode = computed(() => services?.uiService.get<boolean>('uiSelectMode'));
    const root = computed(() => services?.editorService.get<MApp>('root'));
    const page = computed(() => services?.editorService.get<MPage>('page'));
    const zoom = computed(() => services?.uiService.get<number>('zoom'));
    const node = computed(() => services?.editorService.get<MNode>('node'));
    const stageStyle = computed(() => ({
      width: `${stageRect.value?.width}px`,
      height: `${stageRect.value?.height}px`,
      transform: `scale(${zoom.value})`,
    }));

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
        canSelect: (el, stop) => {
          const elCanSelect = props.canSelect(el);
          // 在组件联动过程中不能再往下选择，返回并触发 ui-select
          if (uiSelectMode.value && elCanSelect) {
            document.dispatchEvent(new CustomEvent('ui-select', { detail: el }));
            return stop();
          }

          return elCanSelect;
        },
        moveableOptions: props.moveableOptions,
      });

      services?.editorService.set('stage', stage);

      stage?.mount(stageContainer.value);

      stage?.on('select', (el: HTMLElement) => emit('select', el));

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

    watch(
      () => node.value?.id,
      (id) => {
        nextTick(() => {
          // 等待相关dom变更完成后，再select，适用大多数场景
          id && stage?.select(id);
        });
      },
    );

    const resizeObserver = new ResizeObserver((entries) => {
      for (const { contentRect } of entries) {
        services?.uiService.set('stageContainerRect', {
          width: contentRect.width,
          height: contentRect.height,
        });
      }
    });

    onMounted(() => {
      stageWrap.value && resizeObserver.observe(stageWrap.value);
    });

    onUnmounted(() => {
      stage?.destroy();
      resizeObserver.disconnect();
      services?.editorService.set('stage', null);
    });

    return {
      stageWrap,
      stageContainer,
      stageStyle,
      ...useMenu(),
    };
  },
});
</script>
