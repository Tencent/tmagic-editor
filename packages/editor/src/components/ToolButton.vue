<template>
  <div v-if="display" class="menu-item">
    <el-divider v-if="item.type === 'divider'" direction="vertical"></el-divider>
    <div v-else-if="item.type === 'text'" class="menu-item-text">{{ item.text }}</div>

    <template v-else-if="item.type === 'zoom'">
      <m-icon :icon="ZoomIn" @click="zoomInHandler"></m-icon>
      <span class="menu-item-text" style="margin: 0 5px">{{ parseInt(`${zoom * 100}`, 10) }}%</span>
      <m-icon :icon="ZoomOut" @click="zoomOutHandler"></m-icon>
    </template>

    <el-tooltip
      v-else-if="item.type === 'button'"
      effect="dark"
      placement="bottom-start"
      :content="item.tooltip || item.text"
    >
      <el-button size="small" type="text" :disabled="disabled" @click="buttonHandler(item)"
        ><m-icon :icon="item.icon"></m-icon><span>{{ item.text }}</span></el-button
      >
    </el-tooltip>

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

<script lang="ts">
import { computed, defineComponent, inject, PropType } from 'vue';
import { ArrowDown, Back, Delete, Grid, Right, ScaleToOriginal, ZoomIn, ZoomOut } from '@element-plus/icons';

import { NodeType } from '@tmagic/schema';

import MIcon from '@editor/components/Icon.vue';
import type { MenuButton, MenuComponent, MenuItem, Services } from '@editor/type';

export default defineComponent({
  components: { MIcon, ArrowDown },

  props: {
    data: {
      type: [Object, String] as PropType<MenuItem | string>,
      require: true,
      default: () => ({
        type: 'text',
        display: false,
      }),
    },
  },

  setup(props) {
    const services = inject<Services>('services');
    const uiService = services?.uiService;

    const zoomInHandler = () => uiService?.set('zoom', zoom.value + 0.1);
    const zoomOutHandler = () => uiService?.set('zoom', zoom.value - 0.1);

    const zoom = computed((): number => uiService?.get<number>('zoom') ?? 1);
    const showGuides = computed((): boolean => uiService?.get<boolean>('showGuides') ?? true);
    const showRule = computed((): boolean => uiService?.get<boolean>('showRule') ?? true);

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
            icon: Delete,
            tooltip: '刪除',
            disabled: () => services?.editorService.get('node')?.type === NodeType.PAGE,
            handler: () => services?.editorService.remove(services?.editorService.get('node')),
          };
        case 'undo':
          return {
            type: 'button',
            icon: Back,
            tooltip: '后退',
            disabled: () => !services?.historyService.state.canUndo,
            handler: () => services?.editorService.undo(),
          };
        case 'redo':
          return {
            type: 'button',
            icon: Right,
            tooltip: '前进',
            disabled: () => !services?.historyService.state.canRedo,
            handler: () => services?.editorService.redo(),
          };
        case 'zoom-in':
          return {
            type: 'button',
            icon: ZoomIn,
            tooltip: '放大',
            handler: zoomInHandler,
          };
        case 'zoom-out':
          return {
            type: 'button',
            icon: ZoomOut,
            tooltip: '縮小',
            handler: zoomOutHandler,
          };
        case 'rule':
          return {
            type: 'button',
            icon: ScaleToOriginal,
            tooltip: showRule.value ? '隐藏标尺' : '显示标尺',
            handler: () => uiService?.set('showRule', !showRule.value),
          };
        case 'guides':
          return {
            type: 'button',
            icon: Grid,
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

    return {
      ZoomIn,
      ZoomOut,

      item,
      zoom,
      disabled,
      display: computed(() => {
        if (!item.value) return false;
        if (typeof item.value === 'string') return true;
        if (typeof item.value.display === 'function') {
          return item.value.display(services);
        }
        return item.value.display ?? true;
      }),

      zoomInHandler,
      zoomOutHandler,

      dropdownHandler(command: any) {
        if (command.item.handler) {
          command.item.handler(services);
        }
      },

      buttonHandler(item: MenuButton | MenuComponent) {
        if (disabled.value) return;
        if (typeof (item as MenuButton).handler === 'function') {
          (item as MenuButton).handler?.(services);
        }
      },
    };
  },
});
</script>
