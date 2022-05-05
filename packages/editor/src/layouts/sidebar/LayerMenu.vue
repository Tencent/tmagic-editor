<template>
  <content-menu :menu-data="menuData" ref="menu" style="overflow: initial"></content-menu>
</template>

<script lang="ts">
import { computed, defineComponent, inject, ref } from 'vue';

import { NodeType } from '@tmagic/schema';

import ContentMenu from '@editor/components/ContentMenu.vue';
import type { ComponentGroup, MenuButton, MenuItem, Services } from '@editor/type';

export default defineComponent({
  components: { ContentMenu },

  setup() {
    const services = inject<Services>('services');
    const menu = ref<InstanceType<typeof ContentMenu>>();
    const node = computed(() => services?.editorService.get('node'));
    const isRoot = computed(() => node.value?.type === NodeType.ROOT);
    const isPage = computed(() => node.value?.type === NodeType.PAGE);
    const componentList = computed(() => services?.componentListService.getList() || []);

    const createMenuItems = (group: ComponentGroup): MenuButton[] =>
      group.items.map((component) => ({
        text: component.text,
        type: 'button',
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

    return {
      menu,
      menuData: computed<MenuItem[]>(() => [
        {
          type: 'button',
          text: '新增',
          display: () => node.value?.items?.length > 0,
          items: getSubMenuData.value,
        },
        {
          type: 'button',
          text: '复制',
          display: () => !isRoot.value,
          handler: () => {
            node.value && services?.editorService.copy(node.value);
          },
        },
        {
          type: 'button',
          text: '删除',
          display: () => !isRoot.value && !isPage.value,
          handler: () => {
            node.value && services?.editorService.remove(node.value);
          },
        },
      ]),

      show(e: MouseEvent) {
        menu.value?.show(e);
      },
    };
  },
});
</script>
