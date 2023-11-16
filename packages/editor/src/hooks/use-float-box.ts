import { computed, ComputedRef, inject, nextTick, ref, watch } from 'vue';
import Moveable from 'moveable';

import { type Services } from '@editor/type';

export const useFloatBox = (slideKeys: ComputedRef<string[]>) => {
  const services = inject<Services>('services');
  const moveable = ref<Moveable>();
  const floatBox = ref<HTMLElement[]>();

  const floatBoxStates = computed(() => services?.uiService.get('floatBox'));

  const curKey = ref('');
  const target = computed(() =>
    floatBox.value
      ? floatBox.value.find((item) => item.classList.contains(`m-editor-float-box-${curKey.value}`))
      : undefined,
  );

  const showingBoxKeys = computed(() =>
    [...(floatBoxStates.value?.keys() ?? [])].filter((key) => floatBoxStates.value?.get(key)?.status),
  );

  const isDraging = ref(false);

  const showFloatBox = async (key: string) => {
    const curBoxStatus = floatBoxStates.value?.get(curKey.value)?.status;
    if (curKey.value === key && curBoxStatus) return;
    curKey.value = key;
    setSlideState(key, {
      zIndex: getMaxZIndex() + 1,
      status: true,
    });

    await nextTick();
    if (moveable.value) {
      moveable.value.target = target.value;
      moveable.value.dragTarget = getDragTarget();
      moveable.value.updateRect();
    } else {
      initFloatBoxMoveable();
    }
  };

  const setSlideState = (key: string, data: Record<string, string | number | boolean>) => {
    const slideState = floatBoxStates.value?.get(key);
    if (!slideState) return;
    floatBoxStates.value?.set(key, {
      ...slideState,
      ...data,
    });
  };

  const getDragTarget = (key?: string) => `.m-editor-float-box-header-${key ?? curKey.value}`;

  const closeFloatBox = (key: string) => {
    setSlideState(key, {
      status: false,
    });

    // 如果只有一个，关掉后需要销毁moveable实例
    if (!floatBoxStates.value?.values) return;
    const keys = [...floatBoxStates.value?.keys()];
    const values = [...floatBoxStates.value?.values()];
    const lastFloatBoxLen = values.filter((state) => state.status).length;
    if (lastFloatBoxLen === 0) {
      moveable.value?.destroy();
      moveable.value = undefined;
      return;
    }

    // 如果关掉的 box 是最大的，需要选中下面的一层
    if (key === curKey.value) {
      // 查找显示的最大 zIndex 对应的 index
      const zIndexList = values.filter((item) => item.status).map((item) => item.zIndex);
      const maxZIndex = Math.max(...zIndexList);
      const key = keys.find((key) => floatBoxStates.value?.get(key)?.zIndex === maxZIndex);
      if (!key) return;
      showFloatBox(key);
    }
  };

  const getMaxZIndex = () => {
    if (!floatBoxStates.value?.values()) return 0;
    const list = [...floatBoxStates.value?.values()].map((state) => state.zIndex);
    return Math.max(...list) ?? 0;
  };

  const initFloatBoxMoveable = () => {
    const dragTarget = getDragTarget();
    moveable.value = new Moveable(document.body, {
      target: target.value,
      draggable: true,
      resizable: true,
      edge: true,
      keepRatio: false,
      origin: false,
      snappable: true,
      dragTarget,
      dragTargetSelf: false,
      linePadding: 10,
      controlPadding: 10,
      elementGuidelines: [...(floatBoxStates.value?.keys() ?? [])].map((key) => getDragTarget(key)),
      bounds: { left: 0, top: 0, right: 0, bottom: 0, position: 'css' },
    });
    moveable.value.on('drag', (e) => {
      e.target.style.transform = e.transform;
    });
    moveable.value.on('resize', (e) => {
      e.target.style.width = `${e.width}px`;
      e.target.style.height = `${e.height}px`;
      e.target.style.transform = e.drag.transform;
    });
  };

  const dragendHandler = (key: string, e: DragEvent) => {
    setSlideState(key, {
      left: e.clientX,
      top: e.clientY,
    });
    showFloatBox(key);
    isDraging.value = false;
  };

  document.body.addEventListener('dragover', (e: DragEvent) => {
    if (!isDraging.value) return;
    e.preventDefault();
  });

  const dragstartHandler = () => (isDraging.value = true);

  // 监听 slide 长度变化，更新 ui serice map
  watch(
    () => slideKeys.value,
    () => {
      services?.uiService.setFloatBox(slideKeys.value);
    },
    {
      deep: true,
      immediate: true,
    },
  );

  return {
    showFloatBox,
    closeFloatBox,
    dragstartHandler,
    dragendHandler,
    floatBoxStates,
    floatBox,
    showingBoxKeys,
  };
};
