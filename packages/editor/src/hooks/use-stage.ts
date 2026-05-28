import { computed, watch } from 'vue';

import type { MNode } from '@tmagic/core';
import StageCore, { GuidesType, RemoveEventData, SortEventData, UpdateEventData } from '@tmagic/stage';
import { getIdFromEl } from '@tmagic/utils';

import editorService from '@editor/services/editor';
import uiService from '@editor/services/ui';
import type { StageOptions } from '@editor/type';
import { H_GUIDE_LINE_STORAGE_KEY, UI_SELECT_MODE_EVENT_NAME, V_GUIDE_LINE_STORAGE_KEY } from '@editor/utils/const';
import { buildChangeRecords, getGuideLineFromCache } from '@editor/utils/editor';

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
    canDropIn: stageOptions.canDropIn,
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
    alwaysMultiSelect: stageOptions.alwaysMultiSelect,
    disabledRule: stageOptions.disabledRule,
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

  watch(
    () => editorService.get('alwaysMultiSelect'),
    (alwaysMultiSelect) => {
      stage.setAlwaysMultiSelect(Boolean(alwaysMultiSelect));
    },
  );

  const hGuidesCache = getGuideLineFromCache(getGuideLineKey(H_GUIDE_LINE_STORAGE_KEY));
  const vGuidesCache = getGuideLineFromCache(getGuideLineKey(V_GUIDE_LINE_STORAGE_KEY));

  stage.mask?.setGuides([hGuidesCache, vGuidesCache]);

  uiService.set('hasGuides', hGuidesCache.length > 0 || vGuidesCache.length > 0);

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
      // 拖动多选元素到一个新容器：整批合成一次 moveToContainer，只产生一条历史记录
      const pId = getIdFromEl()(ev.parentEl);
      if (!pId) return;
      const configs = ev.data
        .map((data) => {
          const id = getIdFromEl()(data.el);
          if (!id) return null;
          const cfg: MNode = { id, style: data.style };
          return cfg;
        })
        .filter((cfg): cfg is MNode => Boolean(cfg));
      if (configs.length > 0) {
        editorService.moveToContainer(configs, pId);
      }
      return;
    }

    // 多选拖动 / 多选缩放：所有元素整批走一次 update，避免历史栈被切成 N 条
    // changeRecordList 与 configs 同序，每个节点保留自己的 records；
    // 不能把多个节点的 records 合并到同一个数组里，否则 doUpdate / nodeUpdateHandler 会把别的节点的 propPath 当成自己的。
    const configs: MNode[] = [];
    const changeRecordList: ReturnType<typeof buildChangeRecords>[] = [];
    ev.data.forEach((data) => {
      const id = getIdFromEl()(data.el);
      if (!id) return;

      const { style = {} } = data;
      configs.push({ id, style });
      changeRecordList.push(buildChangeRecords(style, 'style'));
    });
    if (configs.length === 0) return;

    editorService.update(configs, { changeRecordList });
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

    uiService.set(
      'hasGuides',
      (stage.mask?.horizontalGuidelines.length ?? 0) > 0 || (stage.mask?.verticalGuidelines.length ?? 0) > 0,
    );

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
