import { computed } from 'vue';

import StageCore, { GuidesType, RemoveEventData, SortEventData, UpdateEventData } from '@tmagic/stage';

import editorService from '../services/editor';
import uiService from '../services/ui';
import { H_GUIDE_LINE_STORAGE_KEY, StageOptions, V_GUIDE_LINE_STORAGE_KEY } from '../type';

import { getGuideLineFromCache } from './editor';

const root = computed(() => editorService.get('root'));
const page = computed(() => editorService.get('page'));
const zoom = computed(() => uiService.get('zoom') || 1);
const uiSelectMode = computed(() => uiService.get('uiSelectMode'));

const getGuideLineKey = (key: string) => `${key}_${root.value?.id}_${page.value?.id}`;

export const useStage = (stageOptions: StageOptions) => {
  const stage = new StageCore({
    render: stageOptions.render,
    runtimeUrl: stageOptions.runtimeUrl,
    zoom: zoom.value,
    autoScrollIntoView: stageOptions.autoScrollIntoView,
    isContainer: stageOptions.isContainer,
    containerHighlightClassName: stageOptions.containerHighlightClassName,
    containerHighlightDuration: stageOptions.containerHighlightDuration,
    containerHighlightType: stageOptions.containerHighlightType,
    disabledDragStart: stageOptions.disabledDragStart,
    canSelect: (el, event, stop) => {
      const elCanSelect = stageOptions.canSelect(el);
      // 在组件联动过程中不能再往下选择，返回并触发 ui-select
      if (uiSelectMode.value && elCanSelect && event.type === 'mousedown') {
        document.dispatchEvent(new CustomEvent('ui-select', { detail: el }));
        return stop();
      }

      return elCanSelect;
    },
    moveableOptions: stageOptions.moveableOptions,
    updateDragEl: stageOptions.updateDragEl,
  });

  stage.mask.setGuides([
    getGuideLineFromCache(getGuideLineKey(H_GUIDE_LINE_STORAGE_KEY)),
    getGuideLineFromCache(getGuideLineKey(V_GUIDE_LINE_STORAGE_KEY)),
  ]);

  stage.on('select', (el: HTMLElement) => {
    if (`${editorService.get('node')?.id}` === el.id && editorService.get('nodes').length === 1) return;
    editorService.select(el.id);
  });

  stage.on('highlight', (el: HTMLElement) => {
    editorService.highlight(el.id);
  });

  stage.on('multi-select', (els: HTMLElement[]) => {
    editorService.multiSelect(els.map((el) => el.id));
  });

  stage.on('update', (ev: UpdateEventData) => {
    if (ev.parentEl) {
      for (const data of ev.data) {
        editorService.moveToContainer({ id: data.el.id, style: data.style }, ev.parentEl.id);
      }
      return;
    }

    editorService.update(ev.data.map((data) => ({ id: data.el.id, style: data.style })));
  });

  stage.on('sort', (ev: SortEventData) => {
    editorService.sort(ev.src, ev.dist);
  });

  stage.on('remove', (ev: RemoveEventData) => {
    editorService.remove(
      ev.data.map(({ el }) => ({
        id: el.id,
      })),
    );
  });

  stage.on('select-parent', () => {
    const parent = editorService.get('parent');
    if (!parent) throw new Error('父节点为空');
    editorService.select(parent);
    editorService.get('stage')?.select(parent.id);
  });

  stage.on('change-guides', (e) => {
    uiService.set('showGuides', true);

    if (!root.value || !page.value) return;

    const storageKey = getGuideLineKey(
      e.type === GuidesType.HORIZONTAL ? H_GUIDE_LINE_STORAGE_KEY : V_GUIDE_LINE_STORAGE_KEY,
    );
    if (e.guides.length) {
      globalThis.localStorage.setItem(storageKey, JSON.stringify(e.guides));
    } else {
      globalThis.localStorage.removeItem(storageKey);
    }
  });

  return stage;
};
