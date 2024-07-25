import { computed, type ComputedRef, nextTick, type Ref, ref } from 'vue';
import { throttle } from 'lodash-es';

import { Id, MNode } from '@tmagic/schema';
import { isPage, isPageFragment } from '@tmagic/utils';

import { LayerNodeStatus, Services, TreeNodeData, UI_SELECT_MODE_EVENT_NAME } from '@editor/type';
import { updateStatus } from '@editor/utils/tree';

import LayerMenu from './LayerMenu.vue';

export const useClick = (
  services: Services | undefined,
  isCtrlKeyDown: Ref<boolean>,
  nodeStatusMap: ComputedRef<Map<Id, LayerNodeStatus> | undefined>,
) => {
  const isMultiSelect = computed(() => isCtrlKeyDown.value && !services?.editorService.get('disabledMultiSelect'));

  // 触发画布选中
  const select = async (data: MNode) => {
    if (!data.id) {
      throw new Error('没有id');
    }

    if (isMultiSelect.value) {
      multiSelect(data);
    } else {
      await services?.editorService.select(data);
      services?.editorService.get('stage')?.select(data.id);
      services?.stageOverlayService.get('stage')?.select(data.id);
    }
  };

  const multiSelect = async (data: MNode) => {
    if (isPage(data) || isPageFragment(data)) {
      return;
    }

    const nodes = services?.editorService.get('nodes') || [];

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

    await services?.editorService.multiSelect(newNodes);
    services?.editorService.get('stage')?.multiSelect(newNodes);
    services?.stageOverlayService.get('stage')?.multiSelect(newNodes);
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
    services?.editorService?.highlight(data);
    services?.editorService?.get('stage')?.highlight(data.id);
    services?.stageOverlayService?.get('stage')?.highlight(data.id);
  };

  const nodeClickHandler = (event: MouseEvent, data: TreeNodeData): void => {
    if (!nodeStatusMap?.value) return;

    if (services?.uiService.get('uiSelectMode')) {
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

  // 右键菜单
  const menu = ref<InstanceType<typeof LayerMenu>>();

  return {
    menu,

    nodeClickHandler,

    nodeContentMenuHandler(event: MouseEvent, data: TreeNodeData): void {
      event.preventDefault();

      const nodes = services?.editorService.get('nodes') || [];
      if (nodes.length < 2 || !nodes.includes(data)) {
        nodeClickHandler(event, data);
      }

      menu.value?.show(event);
    },

    highlightHandler,
  };
};
