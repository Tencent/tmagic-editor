<template>
  <div class="m-editor-stage">
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

import type { Services } from '@editor/type';

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

    root: {
      type: Object as PropType<MApp>,
    },

    page: {
      type: Object as PropType<MPage>,
    },

    node: {
      type: Object as PropType<MNode>,
    },

    uiSelectMode: {
      type: Boolean,
    },

    zoom: {
      type: Number,
    },

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
    const stageContainer = ref<HTMLDivElement>();

    const stageStyle = computed(() => ({
      ...services?.uiService.get<Record<string, string | number>>('stageStyle'),
      transform: `scale(${props.zoom}) translate3d(0, -50%, 0)`,
    }));

    let stage: StageCore | null = null;
    let runtime: Runtime | null = null;

    watchEffect(() => {
      if (stage) return;

      if (!stageContainer.value) return;
      if (!(props.runtimeUrl || props.render) || !props.root) return;

      stage = new StageCore({
        render: props.render,
        runtimeUrl: props.runtimeUrl,
        zoom: props.zoom,
        canSelect: (el, stop) => {
          const elCanSelect = props.canSelect(el);
          // 在组件联动过程中不能再往下选择，返回并触发 ui-select
          if (props.uiSelectMode && elCanSelect) {
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

      if (!props.node?.id) return;
      stage?.on('runtime-ready', (rt) => {
        runtime = rt;
        // toRaw返回的值是一个引用而非快照，需要cloneDeep
        props.root && runtime?.updateRootConfig(cloneDeep(toRaw(props.root)));
        props.page?.id && runtime?.updatePageId?.(props.page.id);
        setTimeout(() => {
          props.node && stage?.select(toRaw(props.node.id));
        });
      });
    });

    watch(
      () => props.zoom,
      (zoom) => {
        if (!stage || !zoom) return;
        stage?.setZoom(zoom);
      },
    );

    watch(
      () => props.root,
      (root) => {
        if (runtime && root) {
          runtime.updateRootConfig(cloneDeep(toRaw(root)));
        }
      },
    );

    onUnmounted(() => {
      stage?.destroy();
      services?.editorService.set('stage', null);
    });

    return {
      stageStyle,
      ...useMenu(),

      stageContainer,
    };
  },
});
</script>
