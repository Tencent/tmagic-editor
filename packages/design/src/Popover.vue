<template>
  <slot name="reference"></slot>
  <Teleport to="body">
    <div
      v-if="popoverVisible || !destroyOnClose"
      v-show="popoverVisible"
      class="tmagic-design-popper"
      ref="popperElementRef"
      :tabindex="tabindex"
      :class="popperClass"
      :style="style"
      @mouseenter.once="popperMouseenterHandler"
    >
      <slot></slot>
      <span class="tmagic-design-popper-arrow" data-popper-arrow></span>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { Instance } from '@popperjs/core';
import { createPopper } from '@popperjs/core';

import { useZIndex } from './index';
import type { PopoverProps } from './types';

defineSlots<{
  /** 触发 Popover 显示的 HTML 元素 */
  reference(_props: {}): any;
  /** Popover 内嵌 HTML 文本 */
  default(_props: {}): any;
}>();

defineOptions({
  name: 'TMPopper',
  inheritAttrs: false,
});

const props = withDefaults(defineProps<PopoverProps>(), {
  trigger: 'hover',
  disabled: false,
  visible: undefined,
  tabindex: 0,
  destroyOnClose: false,
  closeOnClickOutside: true,
});

const emit = defineEmits<{
  /** 受控模式（传入了 visible）下点击外部收起时触发，便于配合 v-model:visible。 */
  'update:visible': [_visible: boolean];
  /** 点击 popover 及其衍生浮层以外的区域时触发。 */
  clickoutside: [_event: MouseEvent];
}>();

const popoverVisible = ref(false);

const visibleWatch = watch(
  () => props.visible,
  (visible) => {
    if (typeof visible === 'undefined') {
      nextTick(() => {
        visibleWatch();
      });
      return;
    }

    popoverVisible.value = visible;
  },
  {
    immediate: true,
  },
);

const style = computed(() => {
  if (!props.width) {
    return {};
  }

  let { width } = props;

  if (typeof width === 'number') {
    width = `${width}px`;
  }

  return {
    width,
  };
});

const referenceElementRef = ref<HTMLElement>();
const popperElementRef = ref<HTMLElement>();

const instanceRef = shallowRef<Instance | undefined>();

onMounted(() => {
  referenceElementRef.value = getCurrentInstance()?.proxy?.$el.nextElementSibling;
});

const zIndex = useZIndex();
watch([referenceElementRef, popperElementRef, popoverVisible], ([referenceElement, popperElement, popoverVisible]) => {
  destroy();
  if (!referenceElement || !popperElement || !popoverVisible) return;

  popperElement.style.zIndex = `${zIndex.nextZIndex()}`;

  instanceRef.value = createPopper(referenceElement, popperElement, {
    placement: props.placement || 'bottom',
    strategy: 'absolute',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 10],
        },
      },
    ],
  });
});

const popperMouseenterHandler = () => {
  popperElementRef.value?.focus();
};

const clickHandler = () => {
  if (props.disabled) return;

  popoverVisible.value = !popoverVisible.value;
};

const mouseenterHandler = () => {
  if (props.disabled) return;

  if (timer) {
    clearTimeout(timer);
  }

  popoverVisible.value = true;
};

let timer: ReturnType<typeof setTimeout> | null = null;
const mouseleaveHandler = () => {
  if (props.disabled) return;

  if (timer) {
    clearTimeout(timer);
  }

  timer = globalThis.setTimeout(() => {
    popoverVisible.value = false;
    timer = null;
  }, 350);
};

if (props.trigger === 'click' && typeof props.visible === 'undefined') {
  watch(
    referenceElementRef,
    (el, prevEl) => {
      el?.addEventListener('click', clickHandler);
      prevEl?.removeEventListener('click', clickHandler);
    },
    {
      immediate: true,
    },
  );
}

if (props.trigger === 'hover' && typeof props.visible === 'undefined') {
  watch(
    referenceElementRef,
    (el, prevEl) => {
      el?.addEventListener('mouseenter', mouseenterHandler);
      prevEl?.removeEventListener('mouseenter', mouseenterHandler);
      el?.addEventListener('mouseleave', mouseleaveHandler);
      prevEl?.removeEventListener('mouseleave', mouseleaveHandler);
    },
    {
      immediate: true,
    },
  );

  watch(popperElementRef, (el, prevEl) => {
    el?.addEventListener('mouseenter', mouseenterHandler);
    prevEl?.removeEventListener('mouseenter', mouseenterHandler);
    el?.addEventListener('mouseleave', mouseleaveHandler);
    prevEl?.removeEventListener('mouseleave', mouseleaveHandler);
  });
}

/**
 * popover 内部触发、却挂载到 body（在 popper 之外）的浮层：弹窗、二次确认框、tooltip、
 * 下拉 / 日期选择等。点击它们属于 popover 内部交互，不应顺带把 popover 关闭。
 *
 * 由于 @tmagic/design 通过适配器支持 element-plus、tdesign 等多套 UI 库，这里同时列出
 * 两套库的浮层 class（class 名互不冲突，未命中的选择器无副作用），避免切换适配器后失效。
 */
const DEFAULT_CLICK_OUTSIDE_IGNORE = [
  // @tmagic/design 自身（与适配器无关）
  '.tmagic-design-dialog',
  // element-plus
  '.el-overlay',
  '.el-message-box',
  '.el-popper',
  '.el-select-dropdown',
  '.el-picker__popper',
  '.el-dropdown__popper',
  '.el-cascader__dropdown',
  // tdesign：弹窗 / 消息确认（DialogPlugin / MessagePlugin）与各类浮层（tooltip / select / dropdown / 日期选择等均挂在 .t-popup 内）
  '.t-dialog__ctx',
  '.t-dialog',
  '.t-message',
  '.t-popup',
].join(',');

const clickOutsideIgnoreSelector = computed(() =>
  [DEFAULT_CLICK_OUTSIDE_IGNORE, props.clickOutsideIgnore].filter(Boolean).join(','),
);

const handleClickOutside = (e: MouseEvent) => {
  if (props.disabled) return;

  const target = e.target as HTMLElement | null;
  if (!target) return;

  // 点击 reference、popper 自身或衍生浮层时保持打开
  if (referenceElementRef.value?.contains(target)) return;
  if (popperElementRef.value?.contains(target)) return;
  if (target.closest(clickOutsideIgnoreSelector.value)) return;

  emit('clickoutside', e);

  // 非受控：直接收起；受控：通过 update:visible 通知父级（可配合 v-model:visible）
  if (typeof props.visible === 'undefined') {
    popoverVisible.value = false;
  } else {
    emit('update:visible', false);
  }
};

const bindClickOutside = () => globalThis.document?.addEventListener('click', handleClickOutside);
const unbindClickOutside = () => globalThis.document?.removeEventListener('click', handleClickOutside);

watch(popoverVisible, (visible) => {
  if (!props.closeOnClickOutside) return;

  if (visible) {
    // 延后到「打开 popover 的这一次点击」冒泡结束后再监听，避免刚打开就被立即关闭
    nextTick(bindClickOutside);
  } else {
    unbindClickOutside();
  }
});

const destroy = () => {
  if (!instanceRef.value) return;

  instanceRef.value.destroy();
  instanceRef.value = undefined;
};

onBeforeUnmount(() => {
  destroy();
  unbindClickOutside();
});
</script>
