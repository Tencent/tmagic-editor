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
  reference(props: {}): any;
  /** Popover 内嵌 HTML 文本 */
  default(props: {}): any;
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
});

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

let timer: NodeJS.Timeout | null = null;
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

const destroy = () => {
  if (!instanceRef.value) return;

  instanceRef.value.destroy();
  instanceRef.value = undefined;
};

onBeforeUnmount(() => {
  destroy();
});
</script>
