<template>
  <div
    v-if="display"
    class="menu-item"
    :class="item.type"
    @click="clickHandler(item, $event)"
    @mousedown="mousedownHandler(item, $event)"
    @mouseup="mouseupHandler(item, $event)"
  >
    <el-divider v-if="item.type === 'divider'" :direction="item.direction || 'vertical'"></el-divider>
    <div v-else-if="item.type === 'text'" class="menu-item-text">{{ item.text }}</div>

    <template v-else-if="item.type === 'zoom'">
      <tool-button
        :data="{ type: 'button', icon: ZoomOut, handler: zoomOutHandler, tooltip: '缩小' }"
        :event-type="eventType"
      ></tool-button>
      <span class="menu-item-text" style="margin: 0 5px">{{ parseInt(`${zoom * 100}`, 10) }}%</span>
      <tool-button
        :data="{ type: 'button', icon: ZoomIn, handler: zoomInHandler, tooltip: '放大' }"
        :event-type="eventType"
      ></tool-button>
    </template>

    <template v-else-if="item.type === 'button'">
      <el-tooltip v-if="item.tooltip" effect="dark" placement="bottom-start" :content="item.tooltip">
        <el-button size="small" text :disabled="disabled"
          ><m-icon v-if="item.icon" :icon="item.icon"></m-icon><span>{{ item.text }}</span></el-button
        >
      </el-tooltip>
      <el-button v-else size="small" text :disabled="disabled"
        ><m-icon v-if="item.icon" :icon="item.icon"></m-icon><span>{{ item.text }}</span></el-button
      >
    </template>

    <el-dropdown v-else-if="item.type === 'dropdown'" trigger="click" :disabled="disabled" @command="dropdownHandler">
      <span class="el-dropdown-link menubar-menu-button">
        {{ item.text }}<el-icon class="el-icon--right"><arrow-down></arrow-down></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu v-if="item.items && item.items.length">
          <el-dropdown-item v-for="(subItem, index) in item.items" :key="index" :command="{ item, subItem }">{{
            subItem.text
          }}</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <component v-else-if="item.type === 'component'" v-bind="item.props || {}" :is="item.component"></component>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, markRaw, PropType } from 'vue';
import { ArrowDown, Back, Delete, Grid, Right, ScaleToOriginal, ZoomIn, ZoomOut } from '@element-plus/icons-vue';

import { NodeType } from '@tmagic/schema';

import MIcon from '../components/Icon.vue';
import type { MenuButton, MenuComponent, MenuItem, Services } from '../type';

const props = defineProps({
  data: {
    type: [Object, String] as PropType<MenuItem | string>,
    require: true,
    default: () => ({
      type: 'text',
      display: false,
    }),
  },

  eventType: {
    type: String as PropType<'mousedown' | 'mouseup' | 'click'>,
    default: 'click',
  },
});

const services = inject<Services>('services');
const uiService = services?.uiService;

const zoom = computed((): number => uiService?.get<number>('zoom') ?? 1);
const showGuides = computed((): boolean => uiService?.get<boolean>('showGuides') ?? true);
const showRule = computed((): boolean => uiService?.get<boolean>('showRule') ?? true);

const zoomInHandler = () => uiService?.zoom(0.1);
const zoomOutHandler = () => uiService?.zoom(-0.1);

const item = computed((): MenuButton | MenuComponent => {
  if (typeof props.data !== 'string') {
    return props.data;
  }
  switch (props.data) {
    case '/':
      return {
        type: 'divider',
      };
    case 'zoom':
      return {
        type: 'zoom',
      };
    case 'delete':
      return {
        type: 'button',
        icon: markRaw(Delete),
        tooltip: '刪除',
        disabled: () => services?.editorService.get('node')?.type === NodeType.PAGE,
        handler: () => services?.editorService.remove(services?.editorService.get('node')),
      };
    case 'undo':
      return {
        type: 'button',
        icon: markRaw(Back),
        tooltip: '后退',
        disabled: () => !services?.historyService.state.canUndo,
        handler: () => services?.editorService.undo(),
      };
    case 'redo':
      return {
        type: 'button',
        icon: markRaw(Right),
        tooltip: '前进',
        disabled: () => !services?.historyService.state.canRedo,
        handler: () => services?.editorService.redo(),
      };
    case 'zoom-in':
      return {
        type: 'button',
        icon: markRaw(ZoomIn),
        tooltip: '放大',
        handler: zoomInHandler,
      };
    case 'zoom-out':
      return {
        type: 'button',
        icon: markRaw(ZoomOut),
        tooltip: '縮小',
        handler: zoomOutHandler,
      };
    case 'rule':
      return {
        type: 'button',
        icon: markRaw(ScaleToOriginal),
        tooltip: showRule.value ? '隐藏标尺' : '显示标尺',
        handler: () => uiService?.set('showRule', !showRule.value),
      };
    case 'guides':
      return {
        type: 'button',
        icon: markRaw(Grid),
        tooltip: showGuides.value ? '隐藏参考线' : '显示参考线',
        handler: () => uiService?.set('showGuides', !showGuides.value),
      };
    default:
      return {
        type: 'text',
        text: props.data,
      };
  }
});

const disabled = computed(() => {
  if (typeof item.value === 'string') return false;
  if (item.value.type === 'component') return false;
  if (typeof item.value.disabled === 'function') {
    return item.value.disabled(services);
  }
  return item.value.disabled;
});

const buttonHandler = (item: MenuButton | MenuComponent, event: MouseEvent) => {
  if (disabled.value) return;
  if (typeof (item as MenuButton).handler === 'function' && services) {
    (item as MenuButton).handler?.(services, event);
  }
};

const display = computed(() => {
  if (!item.value) return false;
  if (typeof item.value === 'string') return true;
  if (typeof item.value.display === 'function') {
    return item.value.display(services);
  }
  return item.value.display ?? true;
});

const dropdownHandler = (command: any) => {
  if (command.item.handler) {
    command.item.handler(services);
  }
};

const clickHandler = (item: MenuButton | MenuComponent, event: MouseEvent) => {
  if (props.eventType !== 'click') return;
  if (item.type === 'button') {
    buttonHandler(item, event);
  }
};

const mousedownHandler = (item: MenuButton | MenuComponent, event: MouseEvent) => {
  if (props.eventType !== 'mousedown') return;
  if (item.type === 'button') {
    buttonHandler(item, event);
  }
};

const mouseupHandler = (item: MenuButton | MenuComponent, event: MouseEvent) => {
  if (props.eventType !== 'mouseup') return;
  if (item.type === 'button') {
    buttonHandler(item, event);
  }
};
</script>
