import { computed, type ComputedRef, nextTick, type Ref, type ShallowRef } from 'vue';
import { throttle } from 'lodash-es';

import { Id, MNode } from '@tmagic/core';
import { isPage, isPageFragment } from '@tmagic/utils';

import type { LayerNodeStatus, Services, TreeNodeData } from '@editor/type';
import { UI_SELECT_MODE_EVENT_NAME } from '@editor/utils/const';
import { updateStatus } from '@editor/utils/tree';

import LayerMenu from './LayerMenu.vue';

export const useClick = (
  { editorService, stageOverlayService, uiService }: Services,
  isCtrlKeyDown: Ref<boolean>,
  nodeStatusMap: ComputedRef<Map<Id, LayerNodeStatus> | undefined>,
  menuRef: ShallowRef<InstanceType<typeof LayerMenu> | null>,
) => {
  const isMultiSelect = computed(() => isCtrlKeyDown.value && !editorService.get('disabledMultiSelect'));

  // 触发画布选中
  const select = async (data: MNode) => {
    if (!data.id) {
      throw new Error('没有id');
    }

    if (isMultiSelect.value) {
      multiSelect(data);
    } else {
      await editorService.select(data);
      editorService.get('stage')?.select(data.id);
      stageOverlayService.get('stage')?.select(data.id);
    }
  };

  const multiSelect = async (data: MNode) => {
    if (isPage(data) || isPageFragment(data)) {
      return;
    }

    const nodes = editorService.get('nodes') || [];

    const newNodes: Id[] = [];
    let isCancel = false;
    nodes.forEach((node) => {
      if (node.id === data.id) {
        isCancel = true;
        return;
      }

      if (isPage(node) || isPageFragment(node)) {
        return;
      }

      newNodes.push(node.id);
    });

    // 只剩一个不能取消选中
    if (!isCancel || newNodes.length === 0) {
      newNodes.push(data.id);
    }

    await editorService.multiSelect(newNodes);
    editorService.get('stage')?.multiSelect(newNodes);
    stageOverlayService.get('stage')?.multiSelect(newNodes);
  };

  const throttleTime = 300;
  // 鼠标在组件树移动触发高亮
  const highlightHandler: (event: MouseEvent, data: TreeNodeData) => void = throttle(
    (event: MouseEvent, data: TreeNodeData) => {
      highlight(data);
    },
    throttleTime,
  );

  // 触发画布高亮
  const highlight = (data: TreeNodeData) => {
    editorService.highlight(data);
    editorService.get('stage')?.highlight(data.id);
    stageOverlayService.get('stage')?.highlight(data.id);
  };

  const nodeClickHandler = (event: MouseEvent, data: TreeNodeData): void => {
    if (!nodeStatusMap?.value) return;

    if (uiService.get('uiSelectMode')) {
      document.dispatchEvent(new CustomEvent(UI_SELECT_MODE_EVENT_NAME, { detail: data }));
      return;
    }

    if (data.items && data.items.length > 0 && !isMultiSelect.value) {
      updateStatus(nodeStatusMap.value, data.id, {
        expand: true,
      });
    }

    nextTick(() => {
      select(data);
    });
  };

  return {
    menuRef,

    nodeClickHandler,

    nodeContentMenuHandler(event: MouseEvent, data: TreeNodeData): void {
      event.preventDefault();

      const nodes = editorService.get('nodes') || [];
      if (nodes.length < 2 || !nodes.includes(data)) {
        nodeClickHandler(event, data);
      }

      menuRef.value?.show(event);
    },

    highlightHandler,
  };
};
