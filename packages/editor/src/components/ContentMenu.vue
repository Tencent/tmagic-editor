<template>
  <div v-if="menuData.length" v-show="visible" class="magic-editor-content-menu" ref="menu" :style="menuStyle">
    <div>
      <tool-button
        v-for="(item, index) in menuData"
        event-type="mouseup"
        :data="item"
        :key="index"
        @mouseup="hide"
        @mouseenter="showSubMenu(item)"
      ></tool-button>
    </div>
    <teleport to="body">
      <content-menu class="sub-menu" ref="subMenu" :menu-data="subMenuData"></content-menu>
    </teleport>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, onMounted, PropType, ref } from 'vue';

import { MenuButton, MenuItem } from '@editor/type';

import ToolButton from './ToolButton.vue';

export default defineComponent({
  components: { ToolButton },

  props: {
    menuData: {
      type: Array as PropType<MenuItem[]>,
      default: () => [],
    },
  },

  setup() {
    const menu = ref<HTMLDivElement>();
    const subMenu = ref<any>();
    const visible = ref(false);
    const subMenuData = ref<MenuItem[]>([]);
    const menuStyle = ref({
      left: '0',
      top: '0',
    });

    const hide = () => {
      visible.value = false;
    };

    onMounted(() => {
      globalThis.addEventListener(
        'mousedown',
        (e: MouseEvent) => {
          if (!visible.value || (e.target && menu.value?.contains(e.target as HTMLElement))) {
            return;
          }
          hide();
        },
        true,
      );
    });

    return {
      menu,
      subMenu,
      visible,
      menuStyle,
      subMenuData,

      hide,

      show(e: MouseEvent) {
        visible.value = true;

        nextTick(() => {
          const menuHeight = menu.value?.clientHeight || 0;

          let top = e.clientY;
          if (menuHeight + e.clientY > document.body.clientHeight) {
            top = document.body.clientHeight - menuHeight;
          }

          menuStyle.value = {
            top: `${top}px`,
            left: `${e.clientX}px`,
          };
        });
      },

      showSubMenu(item: MenuItem) {
        const menuItem = item as MenuButton;
        if (typeof item !== 'object' || !menuItem.items?.length) {
          return;
        }

        subMenuData.value = menuItem.items;
        if (menu.value) {
          subMenu.value.show({
            clientX: menu.value.offsetLeft + menu.value.clientWidth,
            clientY: menu.value.offsetTop,
          });
        }
      },
    };
  },
});
</script>
