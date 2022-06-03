<template>
  <div v-if="menuData.length && visible" class="magic-editor-content-menu" ref="menu" :style="menuStyle">
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
      <content-menu
        class="sub-menu"
        ref="subMenu"
        :menu-data="subMenuData"
        :is-sub-menu="true"
        @hide="hide"
      ></content-menu>
    </teleport>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, onMounted, onUnmounted, PropType, ref } from 'vue';

import { MenuButton, MenuItem } from '@editor/type';

import ToolButton from './ToolButton.vue';

export default defineComponent({
  components: { ToolButton },

  props: {
    menuData: {
      type: Array as PropType<MenuItem[]>,
      default: () => [],
    },

    isSubMenu: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['hide', 'show'],

  setup(props, { emit }) {
    const menu = ref<HTMLDivElement>();
    const subMenu = ref<any>();
    const visible = ref(false);
    const subMenuData = ref<MenuItem[]>([]);
    const menuStyle = ref({
      left: '0',
      top: '0',
    });

    const hide = () => {
      if (!visible.value) return;

      visible.value = false;
      subMenu.value?.hide();

      emit('hide');
    };

    const hideHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | undefined;
      if (!visible.value || !target) {
        return;
      }
      if (menu.value?.contains(target) || subMenu.value?.$el?.contains(target)) {
        return;
      }
      hide();
    };

    onMounted(() => {
      if (props.isSubMenu) return;

      globalThis.addEventListener('mousedown', hideHandler, true);
    });

    onUnmounted(() => {
      if (props.isSubMenu) return;

      globalThis.removeEventListener('mousedown', hideHandler, true);
    });

    return {
      menu,
      subMenu,
      visible,
      menuStyle,
      subMenuData,

      hide,

      show(e: MouseEvent) {
        // 加settimeout是以为，如果菜单中的按钮监听的是mouseup，那么菜单显示出来时鼠标如果正好在菜单上就会马上触发按钮的mouseup
        setTimeout(() => {
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

            emit('show');
          });
        }, 300);
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
