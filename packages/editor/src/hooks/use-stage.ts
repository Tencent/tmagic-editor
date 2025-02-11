import { computed, watch } from 'vue';

import type { MNode } from '@tmagic/core';
import StageCore, { GuidesType, RemoveEventData, SortEventData, UpdateEventData } from '@tmagic/stage';
import { getIdFromEl } from '@tmagic/utils';

import editorService from '@editor/services/editor';
import uiService from '@editor/services/ui';
import type { StageOptions } from '@editor/type';
import { H_GUIDE_LINE_STORAGE_KEY, UI_SELECT_MODE_EVENT_NAME, V_GUIDE_LINE_STORAGE_KEY } from '@editor/utils/const';
import { getGuideLineFromCache } from '@editor/utils/editor';

const root = computed(() => editorService.get('root'));
const page = computed(() => editorService.get('page'));
const zoom = computed(() => uiService.get('zoom') || 1);
const uiSelectMode = computed(() => uiService.get('uiSelectMode'));

const getGuideLineKey = (key: string) => `${key}_${root.value?.id}_${page.value?.id}`;

export const useStage = (stageOptions: StageOptions) => {
  const stage = new StageCore({
    render: stageOptions.render,
    runtimeUrl: stageOptions.runtimeUrl,
    zoom: stageOptions.zoom ?? zoom.value,
    autoScrollIntoView: stageOptions.autoScrollIntoView,
    isContainer: stageOptions.isContainer,
    containerHighlightClassName: stageOptions.containerHighlightClassName,
    containerHighlightDuration: stageOptions.containerHighlightDuration,
    containerHighlightType: stageOptions.containerHighlightType,
    disabledDragStart: stageOptions.disabledDragStart,
    renderType: stageOptions.renderType,
    canSelect: (el, event, stop) => {
      if (!stageOptions.canSelect) return true;

      const elCanSelect = stageOptions.canSelect?.(el);
      // 在组件联动过程中不能再往下选择，返回并触发 ui-select
      if (uiSelectMode.value && elCanSelect && event.type === 'mousedown') {
        document.dispatchEvent(new CustomEvent(UI_SELECT_MODE_EVENT_NAME, { detail: el }));
        return stop();
      }

      return elCanSelect;
    },
    moveableOptions: stageOptions.moveableOptions,
    updateDragEl: stageOptions.updateDragEl,
    guidesOptions: stageOptions.guidesOptions,
    disabledMultiSelect: stageOptions.disabledMultiSelect,
  });

  watch(
    () => editorService.get('disabledMultiSelect'),
    (disabledMultiSelect) => {
      if (disabledMultiSelect) {
        stage.disableMultiSelect();
      } else {
        stage.enableMultiSelect();
      }
    },
  );

  stage.mask?.setGuides([
    getGuideLineFromCache(getGuideLineKey(H_GUIDE_LINE_STORAGE_KEY)),
    getGuideLineFromCache(getGuideLineKey(V_GUIDE_LINE_STORAGE_KEY)),
  ]);

  stage.on('page-el-update', () => {
    editorService.set('stageLoading', false);
  });

  stage.on('select', (el: HTMLElement) => {
    const id = getIdFromEl()(el);
    if (`${editorService.get('node')?.id}` === id && editorService.get('nodes').length === 1) return;
    id && editorService.select(id);
  });

  stage.on('highlight', (el: HTMLElement) => {
    const id = getIdFromEl()(el);
    id && editorService.highlight(id);
  });

  stage.on('multi-select', (els: HTMLElement[]) => {
    const ids = els.map((el) => getIdFromEl()(el)).filter((id) => Boolean(id)) as string[];
    editorService.multiSelect(ids);
  });

  stage.on('update', (ev: UpdateEventData) => {
    if (ev.parentEl) {
      for (const data of ev.data) {
        const id = getIdFromEl()(data.el);
        const pId = getIdFromEl()(ev.parentEl);
        id && pId && editorService.moveToContainer({ id, style: data.style }, pId);
      }
      return;
    }

    editorService.update(ev.data.map((data) => ({ id: getIdFromEl()(data.el) || '', style: data.style })));
  });

  stage.on('sort', (ev: SortEventData) => {
    editorService.sort(ev.src, ev.dist);
  });

  stage.on('remove', (ev: RemoveEventData) => {
    const nodes = ev.data.map(({ el }) => editorService.getNodeById(getIdFromEl()(el) || ''));
    editorService.remove(nodes.filter((node) => Boolean(node)) as MNode[]);
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
