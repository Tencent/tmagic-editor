<template>
  <div class="m-editor-nav-menu" :style="{ height: `${height}px` }" ref="navMenu">
    <div v-for="key in keys" :class="`menu-${key}`" :key="key" :style="`width: ${columnWidth?.[key]}px`">
      <ToolButton :data="item" v-for="(item, index) in buttons[key]" :key="index"></ToolButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, markRaw, onBeforeUnmount, onMounted, ref } from 'vue';
import { Back, Delete, FullScreen, Grid, Memo, Right, ScaleToOriginal, ZoomIn, ZoomOut } from '@element-plus/icons-vue';

import { NodeType } from '@tmagic/schema';

import ToolButton from '@editor/components/ToolButton.vue';
import { ColumnLayout, MenuBarData, MenuButton, MenuComponent, MenuItem, Services } from '@editor/type';

defineOptions({
  name: 'MEditorNavMenu',
});

const props = withDefaults(
  defineProps<{
    data?: MenuBarData;
    height?: number;
  }>(),
  {
    data: () => ({}),
    height: 35,
  },
);

const services = inject<Services>('services');
const uiService = services?.uiService;

const columnWidth = computed(() => services?.uiService.get('columnWidth'));
const keys = Object.values(ColumnLayout);

const showGuides = computed((): boolean => uiService?.get('showGuides') ?? true);
const showRule = computed((): boolean => uiService?.get('showRule') ?? true);
const zoom = computed((): number => uiService?.get('zoom') ?? 1);

const isMac = /mac os x/.test(navigator.userAgent.toLowerCase());
const ctrl = isMac ? 'Command' : 'Ctrl';

const getConfig = (item: MenuItem): (MenuButton | MenuComponent)[] => {
  if (typeof item !== 'string') {
    return [item];
  }
  const config: (MenuButton | MenuComponent)[] = [];
  switch (item) {
    case '/':
      config.push({
        type: 'divider',
        className: 'divider',
      });
      break;
    case 'zoom':
      config.push(
        ...getConfig('zoom-out'),
        ...getConfig(`${parseInt(`${zoom.value * 100}`, 10)}%`),
        ...getConfig('zoom-in'),
        ...getConfig('scale-to-original'),
        ...getConfig('scale-to-fit'),
      );
      break;
    case 'delete':
      config.push({
        type: 'button',
        className: 'delete',
        icon: markRaw(Delete),
        tooltip: `刪除(Delete)`,
        disabled: () => services?.editorService.get('node')?.type === NodeType.PAGE,
        handler: () => {
          const node = services?.editorService.get('node');
          node && services?.editorService.remove(node);
        },
      });
      break;
    case 'undo':
      config.push({
        type: 'button',
        className: 'undo',
        icon: markRaw(Back),
        tooltip: `后退(${ctrl}+z)`,
        disabled: () => !services?.historyService.state.canUndo,
        handler: () => services?.editorService.undo(),
      });
      break;
    case 'redo':
      config.push({
        type: 'button',
        className: 'redo',
        icon: markRaw(Right),
        tooltip: `前进(${ctrl}+Shift+z)`,
        disabled: () => !services?.historyService.state.canRedo,
        handler: () => services?.editorService.redo(),
      });
      break;
    case 'zoom-in':
      config.push({
        type: 'button',
        className: 'zoom-in',
        icon: markRaw(ZoomIn),
        tooltip: `放大(${ctrl}+=)`,
        handler: () => uiService?.zoom(0.1),
      });
      break;
    case 'zoom-out':
      config.push({
        type: 'button',
        className: 'zoom-out',
        icon: markRaw(ZoomOut),
        tooltip: `縮小(${ctrl}+-)`,
        handler: () => uiService?.zoom(-0.1),
      });
      break;
    case 'scale-to-original':
      config.push({
        type: 'button',
        className: 'scale-to-original',
        icon: markRaw(ScaleToOriginal),
        tooltip: `缩放到实际大小(${ctrl}+1)`,
        handler: () => uiService?.set('zoom', 1),
      });
      break;
    case 'scale-to-fit':
      config.push({
        type: 'button',
        className: 'scale-to-fit',
        icon: markRaw(FullScreen),
        tooltip: `缩放以适应(${ctrl}+0)`,
        handler: async () => uiService?.set('zoom', await uiService.calcZoom()),
      });
      break;
    case 'rule':
      config.push({
        type: 'button',
        className: 'rule',
        icon: markRaw(Memo),
        tooltip: showRule.value ? '隐藏标尺' : '显示标尺',
        handler: () => uiService?.set('showRule', !showRule.value),
      });
      break;
    case 'guides':
      config.push({
        type: 'button',
        className: 'guides',
        icon: markRaw(Grid),
        tooltip: showGuides.value ? '隐藏参考线' : '显示参考线',
        handler: () => uiService?.set('showGuides', !showGuides.value),
      });
      break;
    default:
      config.push({
        type: 'text',
        text: item,
      });
  }
  return config;
};

const buttons = computed(() => {
  const data: {
    [ColumnLayout.LEFT]: (MenuButton | MenuComponent)[];
    [ColumnLayout.CENTER]: (MenuButton | MenuComponent)[];
    [ColumnLayout.RIGHT]: (MenuButton | MenuComponent)[];
  } = {
    [ColumnLayout.LEFT]: [],
    [ColumnLayout.CENTER]: [],
    [ColumnLayout.RIGHT]: [],
  };
  keys.forEach((key) => {
    const items = props.data[key] || [];
    items.forEach((item) => {
      data[key].push(...getConfig(item));
    });
  });
  return data;
});

const resizeObserver = new ResizeObserver(() => {
  const rect = navMenu.value?.getBoundingClientRect();
  if (rect) {
    uiService?.set('navMenuRect', {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
  }
});
const navMenu = ref<HTMLDivElement>();
onMounted(() => {
  navMenu.value && resizeObserver.observe(navMenu.value);
});
onBeforeUnmount(() => {
  resizeObserver.disconnect();
});
</script>
