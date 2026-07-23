<template>
  <transition name="fade">
    <div
      v-show="visible"
      ref="menu"
      :class="['magic-editor-content-menu', themeClass]"
      :style="menuStyle"
      @mouseenter="mouseenterHandler()"
      @contextmenu.prevent
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
import { computed, nextTick, onBeforeUnmount, onMounted, type Ref, ref, useTemplateRef } from 'vue';

import { useThemeClass, useZIndex } from '@tmagic/design';

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

const menuEl = useTemplateRef<HTMLDivElement>('menu');
const buttonRefs = useTemplateRef<InstanceType<typeof ToolButton>[]>('buttons');
const subMenuRef = useTemplateRef<any>('subMenu');
const visible = ref(false);

/**
 * 主题修饰类（来自最近的 `<MEditor>` / `<MForm>` 祖先 provide）。
 * - 顶层 `ContentMenu` 渲染在编辑器子树中，加上去是冗余但无害；
 * - 子菜单（递归 `<content-menu :is-sub-menu="true">` 被 `<teleport to="body">` 送到 body）
 *   不在编辑器子树中，必须显式挂上主题类，主题级 CSS 变量才能命中。
 */
const themeClass = useThemeClass();
const subMenuData: Ref<(MenuButton | MenuComponent)[]> = ref<(MenuButton | MenuComponent)[]>([]);
const zIndex = useZIndex();
const curZIndex = ref<number>(0);

const menuPosition = ref({
  left: 0,
  top: 0,
});

const menuStyle = computed(() => ({
  top: `${menuPosition.value.top + 2}px`,
  left: `${menuPosition.value.left + 2}px`,
  zIndex: curZIndex.value,
}));

const contains = (el: HTMLElement) => menuEl.value?.contains(el) || subMenuRef.value?.contains(el);

const hide = () => {
  if (!visible.value) return;

  visible.value = false;
  subMenuRef.value?.hide();

  emit('hide');
};

const clickHandler = (event: MouseEvent) => {
  if (!props.autoHide) return;

  if (event.button === 0) {
    hide();
  }
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

// 根据菜单实际尺寸修正位置，避免超出可视范围
const fixPosition = () => {
  const menu = menuEl.value;
  if (!menu || !visible.value) return;

  const menuHeight = menu.clientHeight;
  const menuWidth = menu.clientWidth;

  let { top, left } = menuPosition.value;

  if (top + menuHeight > document.body.clientHeight) {
    top = Math.max(0, document.body.clientHeight - menuHeight);
  }

  if (left + menuWidth > document.body.clientWidth) {
    left = Math.max(0, document.body.clientWidth - menuWidth);
  }

  if (top !== menuPosition.value.top || left !== menuPosition.value.left) {
    menuPosition.value = { top, left };
  }
};

const setPosition = (e: { clientY: number; clientX: number }) => {
  menuPosition.value = {
    top: e.clientY,
    left: e.clientX,
  };
  fixPosition();
};

// 菜单大小动态变化（如菜单项更新）后重新修正位置
const resizeObserver = new ResizeObserver(() => {
  fixPosition();
});

const show = (e?: { clientY: number; clientX: number }) => {
  visible.value = true;

  nextTick(() => {
    e && setPosition(e);

    curZIndex.value = zIndex.nextZIndex();

    emit('show');
  });
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

    if (menuEl.value) {
      // 将子菜单放置在按钮右侧，与按钮齐平
      let y = menuEl.value.offsetTop;
      if (buttonRefs.value?.[index].$el) {
        const rect = buttonRefs.value?.[index].$el.getBoundingClientRect();
        y = rect.top;
      }
      subMenuRef.value?.show({
        clientX: menuEl.value.offsetLeft + menuEl.value.clientWidth - 2,
        clientY: y,
      });
    }
  }, 0);
};

const mouseenterHandler = () => {
  emit('mouseenter');
};

onMounted(() => {
  if (menuEl.value) {
    resizeObserver.observe(menuEl.value);
  }

  if (props.isSubMenu) return;

  globalThis.addEventListener('mousedown', outsideClickHideHandler, true);
});

onBeforeUnmount(() => {
  resizeObserver.disconnect();

  if (props.isSubMenu) return;

  globalThis.removeEventListener('mousedown', outsideClickHideHandler, true);
});

defineExpose({
  menu: menuEl,
  menuPosition,
  hide,
  show,
  contains,
  setPosition,
});
</script>
