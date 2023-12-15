<template>
  <transition name="fade">
    <div
      v-show="visible"
      class="magic-editor-content-menu"
      ref="menu"
      :style="menuStyle"
      @mouseenter="mouseenterHandler()"
    >
      <slot name="title"></slot>
      <div>
        <ToolButton
          v-for="(item, index) in menuData"
          event-type="mouseup"
          ref="buttons"
          :class="{ active: active && item.id === active }"
          :data="item"
          :key="index"
          @mouseup="clickHandler"
          @mouseenter="showSubMenu(item, index)"
        ></ToolButton>
      </div>
      <teleport to="body">
        <content-menu
          v-if="subMenuData.length"
          class="sub-menu"
          ref="subMenu"
          :active="active"
          :menu-data="subMenuData"
          :is-sub-menu="true"
          @hide="hide"
        ></content-menu>
      </teleport>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { MenuButton, MenuComponent } from '@editor/type';

import ToolButton from './ToolButton.vue';

defineOptions({
  name: 'MEditorContentMenu',
});

const props = withDefaults(
  defineProps<{
    menuData?: (MenuButton | MenuComponent)[];
    isSubMenu?: boolean;
    active?: string | number;
    autoHide?: boolean;
  }>(),
  {
    menuData: () => [],
    isSubMenu: false,
    autoHide: true,
  },
);

const emit = defineEmits<{
  hide: [];
  show: [];
  mouseenter: [];
}>();

const menu = ref<HTMLDivElement>();
const buttons = ref<InstanceType<typeof ToolButton>[]>();
const subMenu = ref<any>();
const visible = ref(false);
const subMenuData = ref<(MenuButton | MenuComponent)[]>([]);

const menuPosition = ref({
  left: 0,
  top: 0,
});

const menuStyle = computed(() => ({
  top: `${menuPosition.value.top}px`,
  left: `${menuPosition.value.left}px`,
}));

const contains = (el: HTMLElement) => menu.value?.contains(el) || subMenu.value?.contains(el);

const hide = () => {
  if (!visible.value) return;

  visible.value = false;
  subMenu.value?.hide();

  emit('hide');
};

const clickHandler = () => {
  if (!props.autoHide) return;

  hide();
};

const outsideClickHideHandler = (e: MouseEvent) => {
  if (!props.autoHide) return;

  const target = e.target as HTMLElement | undefined;
  if (!visible.value || !target) {
    return;
  }
  if (contains(target)) {
    return;
  }
  hide();
};

const setPosition = (e: { clientY: number; clientX: number }) => {
  const menuHeight = menu.value?.clientHeight || 0;

  let top = e.clientY;
  if (menuHeight + e.clientY > document.body.clientHeight) {
    top = document.body.clientHeight - menuHeight;
  }

  menuPosition.value = {
    top,
    left: e.clientX,
  };
};

const show = (e?: { clientY: number; clientX: number }) => {
  // 加settimeout是以为，如果菜单中的按钮监听的是mouseup，那么菜单显示出来时鼠标如果正好在菜单上就会马上触发按钮的mouseup
  setTimeout(() => {
    visible.value = true;

    nextTick(() => {
      e && setPosition(e);

      emit('show');
    });
  }, 300);
};

const showSubMenu = (item: MenuButton | MenuComponent, index: number) => {
  const menuItem = item as MenuButton;
  if (typeof item !== 'object') {
    return;
  }

  subMenuData.value = menuItem.items || [];
  setTimeout(() => {
    if (!visible.value) {
      return;
    }

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

const mouseenterHandler = () => {
  emit('mouseenter');
};

onMounted(() => {
  if (props.isSubMenu) return;

  globalThis.addEventListener('mousedown', outsideClickHideHandler, true);
});

onBeforeUnmount(() => {
  if (props.isSubMenu) return;

  globalThis.removeEventListener('mousedown', outsideClickHideHandler, true);
});

defineExpose({
  menu,
  menuPosition,
  hide,
  show,
  contains,
  setPosition,
});
</script>
