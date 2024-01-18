import { computed, inject, nextTick, ref, watch } from 'vue';

import type StageCore from '@tmagic/stage';

import type { Services, StageOptions } from '@editor/type';

import { useStage } from './use-stage';

export const useStageOverlay = () => {
  const services = inject<Services>('services');
  const stageOptions = inject<StageOptions>('stageOptions');

  const wrapWidth = ref(0);
  const wrapHeight = ref(0);
  const stageOverlayVisible = ref(false);
  const stageOverlay = ref<HTMLDivElement>();

  const stage = computed(() => services?.editorService.get('stage'));

  let subStage: StageCore | null = null;

  const div = document.createElement('div');
  let selectEl: HTMLElement | null = null;

  const render = () => {
    if (!selectEl) return;

    const content = selectEl.cloneNode(true) as HTMLElement;
    content.style.position = 'static';
    Array.from(div.children).forEach((element) => {
      element.remove();
    });
    div.appendChild(content);

    subStage?.renderer.contentWindow?.magic.onPageElUpdate(div);

    subStage?.select(content);
  };

  const copyDocumentElement = () => {
    const doc = subStage?.renderer.getDocument();
    const documentElement = stage.value?.renderer.getDocument()?.documentElement;

    if (doc && documentElement) {
      doc.replaceChild(documentElement.cloneNode(true), doc.documentElement);
    }
  };

  const updateOverlay = () => {
    if (!selectEl) return;

    const { scrollWidth, scrollHeight } = selectEl;

    stageOverlay.value!.style.width = `${scrollWidth}px`;
    stageOverlay.value!.style.height = `${scrollHeight}px`;

    wrapWidth.value = scrollWidth;
    wrapHeight.value = scrollHeight;
  };

  const updateHandler = () => {
    render();
    updateOverlay();
  };

  const addHandler = () => {
    render();
    updateOverlay();
  };

  const removeHandler = () => {
    render();
    updateOverlay();
  };

  const openOverlay = async (el: HTMLElement) => {
    selectEl = el;

    stageOverlayVisible.value = true;

    if (!stageOverlay.value) {
      await nextTick();
    }

    if (!stageOptions) {
      return;
    }

    subStage = useStage({
      ...stageOptions,
      runtimeUrl: '',
      autoScrollIntoView: false,
      render(stage: StageCore) {
        copyDocumentElement();

        const rootEl = stage.renderer.getDocument()?.getElementById('app');
        if (rootEl) {
          rootEl.remove();
        }

        div.style.cssText = `
          width: ${el.scrollWidth}px;
          height: ${el.scrollHeight}px;
          background-color: #fff;
        `;

        render();

        return div;
      },
    });
    subStage.mount(stageOverlay.value!);

    const { mask, renderer } = subStage;

    const { contentWindow } = renderer;
    mask.showRule(false);

    updateOverlay();

    contentWindow?.magic.onRuntimeReady({});

    services?.editorService.on('update', updateHandler);
    services?.editorService.on('add', addHandler);
    services?.editorService.on('remove', removeHandler);
  };

  const closeOverlay = () => {
    stageOverlayVisible.value = false;
    subStage?.destroy();
    subStage = null;

    services?.editorService.off('update', updateHandler);
    services?.editorService.off('add', addHandler);
    services?.editorService.off('remove', removeHandler);
  };

  watch(stage, (stage) => {
    if (stage) {
      stage.on('dblclick', async (event: MouseEvent) => {
        const el = await stage.actionManager.getElementFromPoint(event);
        if (el) {
          openOverlay(el);
        }
      });
    } else if (subStage) {
      closeOverlay();
    }
  });

  return {
    wrapWidth,
    wrapHeight,
    stageOverlayVisible,
    stageOverlay,
    closeOverlay,
  };
};
