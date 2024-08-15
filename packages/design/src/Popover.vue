<template>
  <slot name="reference"></slot>
  <Teleport to="body">
    <div
      v-if="popoverVisible"
      class="tmagic-design-popper"
      tabindex="-1"
      ref="popperElementRef"
      :class="popperClass"
      :style="style"
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
  reference(props: {}): any;
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
watch([referenceElementRef, popperElementRef], ([referenceElement, popperElement]) => {
  destroy();
  if (!referenceElement || !popperElement) return;

  popperElement.style.zIndex = `${zIndex.nextZIndex()}`;
  popperElement.focus();

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

  timer = setTimeout(() => {
    popoverVisible.value = false;
  }, 500);
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

<style lang="scss">
.tmagic-design-popper {
  min-width: 150px;
  line-height: 1.4;
  background-color: #fff;
  box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.12);
  color: #606266;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 14px;
  overflow-wrap: break-word;
  box-sizing: border-box;
  padding: 10px;

  &:focus {
    outline: none;
  }
}

.tmagic-design-popper[data-popper-placement^='top'] > .tmagic-design-popper-arrow {
  bottom: -4px;
}

.tmagic-design-popper[data-popper-placement^='bottom'] > .tmagic-design-popper-arrow {
  top: -4px;
}

.tmagic-design-popper[data-popper-placement^='left'] > .tmagic-design-popper-arrow {
  right: -4px;
}

.tmagic-design-popper[data-popper-placement^='right'] > .tmagic-design-popper-arrow {
  left: -4px;
}

.tmagic-design-popper-arrow,
.tmagic-design-popper-arrow::before {
  position: absolute;
  width: 8px;
  height: 8px;
  background: inherit;
}

.tmagic-design-popper-arrow {
  visibility: hidden;
}

.tmagic-design-popper-arrow::before {
  visibility: visible;
  content: '';
  transform: rotate(45deg);
}
</style>
