<template>
  <div v-if="menuData.length" v-show="visible" class="magic-editor-content-menu" ref="menu" :style="menuStyle">
    <div>
      <ToolButton
        v-for="(item, index) in menuData"
        event-type="mouseup"
        ref="buttons"
        :data="item"
        :key="index"
        @mouseup="hide"
        @mouseenter="showSubMenu(item, index)"
      ></ToolButton>
    </div>
    <teleport to="body">
      <content-menu
        v-if="subMenuData.length"
        class="sub-menu"
        ref="subMenu"
        :menu-data="subMenuData"
        :is-sub-menu="true"
        @hide="hide"
      ></content-menu>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

import { MenuButton, MenuComponent } from '@editor/type';

import ToolButton from './ToolButton.vue';

defineOptions({
  name: 'MEditorContentMenu',
});

const props = withDefaults(
  defineProps<{
    menuData?: (MenuButton | MenuComponent)[];
    isSubMenu?: boolean;
  }>(),
  {
    menuData: () => [],
    isSubMenu: false,
  },
);

const emit = defineEmits(['hide', 'show']);

const menu = ref<HTMLDivElement>();
const buttons = ref<InstanceType<typeof ToolButton>[]>();
const subMenu = ref<any>();
const visible = ref(false);
const subMenuData = ref<(MenuButton | MenuComponent)[]>([]);
const menuStyle = ref({
  left: '0',
  top: '0',
});

const contains = (el: HTMLElement) => menu.value?.contains(el) || subMenu.value?.contains(el);

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
  if (contains(target)) {
    return;
  }
  hide();
};

const show = (e: MouseEvent) => {
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
};

const showSubMenu = (item: MenuButton | MenuComponent, index: number) => {
  const menuItem = item as MenuButton;
  if (typeof item !== 'object' || !menuItem.items?.length) {
    return;
  }

  subMenuData.value = menuItem.items || [];
  setTimeout(() => {
    if (menu.value) {
      // 将子菜单放置在按钮右侧，与按钮齐平
      let y = menu.value.offsetTop;
      if (buttons.value?.[index].$el) {
        const rect = buttons.value?.[index].$el.getBoundingClientRect();
        y = rect.top;
      }
      subMenu.value?.show({
        clientX: menu.value.offsetLeft + menu.value.clientWidth,
        clientY: y,
      });
    }
  }, 0);
};

onMounted(() => {
  if (props.isSubMenu) return;

  globalThis.addEventListener('mousedown', hideHandler, true);
});

onUnmounted(() => {
  if (props.isSubMenu) return;

  globalThis.removeEventListener('mousedown', hideHandler, true);
});

defineExpose({
  menu,
  hide,
  show,
  contains,
});
</script>
