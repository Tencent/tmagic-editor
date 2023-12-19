<template>
  <ContentMenu :menu-data="menuData" ref="menu" style="overflow: initial"></ContentMenu>
</template>

<script lang="ts" setup>
import { computed, inject, markRaw, ref } from 'vue';
import { Files, Plus } from '@element-plus/icons-vue';

import { isPage, isPageFragment } from '@tmagic/utils';

import ContentMenu from '@editor/components/ContentMenu.vue';
import FolderMinusIcon from '@editor/icons/FolderMinusIcon.vue';
import type { ComponentGroup, MenuButton, MenuComponent, Services } from '@editor/type';
import { useCopyMenu, useDeleteMenu, useMoveToMenu, usePasteMenu } from '@editor/utils/content-menu';

defineOptions({
  name: 'MEditorLayerMenu',
});

const props = withDefaults(
  defineProps<{
    layerContentMenu: (MenuButton | MenuComponent)[];
    customContentMenu?: (menus: (MenuButton | MenuComponent)[], type: string) => (MenuButton | MenuComponent)[];
  }>(),
  {
    layerContentMenu: () => [],
    customContentMenu: (menus: (MenuButton | MenuComponent)[]) => menus,
  },
);

const emit = defineEmits<{
  'collapse-all': [];
}>();

const services = inject<Services>('services');
const menu = ref<InstanceType<typeof ContentMenu>>();
const node = computed(() => services?.editorService.get('node'));
const nodes = computed(() => services?.editorService.get('nodes'));
const componentList = computed(() => services?.componentListService.getList() || []);

const createMenuItems = (group: ComponentGroup): MenuButton[] =>
  group.items.map((component) => ({
    text: component.text,
    type: 'button',
    icon: component.icon,
    handler: () => {
      services?.editorService.add({
        name: component.text,
        type: component.type,
        ...(component.data || {}),
      });
    },
  }));

const getSubMenuData = computed<MenuButton[]>(() => {
  if (node.value?.type === 'tabs') {
    return [
      {
        text: '标签页',
        type: 'button',
        icon: Files,
        handler: () => {
          services?.editorService.add({
            type: 'tab-pane',
          });
        },
      },
    ];
  }
  if (node.value?.items) {
    return (
      componentList.value.reduce(
        (subMenuData: MenuButton[], group: ComponentGroup, index) =>
          subMenuData.concat(
            createMenuItems(group),
            index < componentList.value.length - 1
              ? [
                  {
                    type: 'divider',
                    direction: 'horizontal',
                  },
                ]
              : [],
          ),
        [],
      ) || []
    );
  }
  return [];
});

const menuData = computed<(MenuButton | MenuComponent)[]>(() =>
  props.customContentMenu(
    [
      {
        type: 'button',
        text: '全部折叠',
        icon: FolderMinusIcon,
        display: () => isPage(node.value) || isPageFragment(node.value),
        handler: () => {
          emit('collapse-all');
        },
      },
      {
        type: 'button',
        text: '新增',
        icon: markRaw(Plus),
        display: () => node.value?.items && nodes.value?.length === 1,
        items: getSubMenuData.value,
      },
      useCopyMenu(),
      usePasteMenu(),
      useDeleteMenu(),
      useMoveToMenu(services),
      ...props.layerContentMenu,
    ],
    'layer',
  ),
);

const show = (e: MouseEvent) => {
  menu.value?.show(e);
};

defineExpose({
  show,
});
</script>
