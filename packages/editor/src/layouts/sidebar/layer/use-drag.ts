import type { Id, MContainer, MNode } from '@tmagic/schema';
import { addClassName, removeClassName } from '@tmagic/utils';

import { DragType, type Services } from '@editor/type';
import { getNodeIndex } from '@editor/utils';

export declare type NodeDropType = 'before' | 'after' | 'inner' | 'none';

const dragState: {
  dragOverNodeId: Id;
  dropType: NodeDropType | '';
  container: HTMLElement | null;
  nodeId?: Id;
} = {
  dragOverNodeId: '',
  dropType: '',
  container: null,
};

const getNodeEl = (el: HTMLElement): HTMLElement | void => {
  if (el.dataset.nodeId) {
    return el;
  }

  if (el.parentElement) {
    return getNodeEl(el.parentElement);
  }
};

const removeStatusClass = (el: HTMLElement | null) => {
  if (!el) return;

  ['drag-before', 'drag-after', 'drag-inner'].forEach((className) => {
    el.querySelectorAll(`.${className}`).forEach((el) => {
      removeClassName(el, className);
    });
  });
};

/**
 * dragstart/dragleave/dragend 属于源节点
 * dragover 属于目标节点
 * 这些方法并不是同一个dom事件触发的
 */
export const useDrag = (services: Services | undefined) => {
  const handleDragStart = (event: DragEvent) => {
    if (!event.dataTransfer || !event.target || !event.currentTarget) return;

    const targetEl = getNodeEl(event.target as HTMLElement);

    if (!targetEl || targetEl !== event.currentTarget) return;

    event.dataTransfer.effectAllowed = 'move';
    dragState.nodeId = targetEl.dataset.nodeId;

    try {
      event.dataTransfer.setData(
        'text/json',
        JSON.stringify({
          dragType: DragType.LAYER_TREE,
        }),
      );
    } catch {}
  };

  const handleDragOver = (event: DragEvent) => {
    if (!event.target) return;

    const targetEl = getNodeEl(event.target as HTMLElement);
    if (!targetEl?.draggable) return;

    const labelEl = targetEl.children[0];
    if (!labelEl) return;

    removeClassName(labelEl, 'drag-before', 'drag-after', 'drag-inner');

    const { top: targetTop, height: targetHeight } = labelEl.getBoundingClientRect();

    const distance = event.clientY - targetTop;
    const isContainer = targetEl.dataset.isContainer === 'true';

    const targetNodeId = targetEl.dataset.nodeId;
    const { nodeId } = dragState;
    const parentsId = targetEl.dataset.parentsId?.split(',');

    if (!targetNodeId) {
      return;
    }

    // 如果是悬浮在拖动的节点上方，则不响应
    if (parentsId) {
      let targetIdIndex = -1;
      for (let i = 0, l = parentsId.length; i < l; i++) {
        const id = parentsId[i];
        if (nodeId === id) {
          targetIdIndex = i;
        }

        if (parentsId.includes(`${nodeId}`) && i >= targetIdIndex) {
          return;
        }
      }
    }

    if (distance < targetHeight / 3) {
      dragState.dropType = 'before';
      addClassName(labelEl, globalThis.document, 'drag-before');
    } else if (distance > (targetHeight * 2) / 3) {
      dragState.dropType = 'after';
      addClassName(labelEl, globalThis.document, 'drag-after');
    } else if (isContainer) {
      dragState.dropType = 'inner';
      addClassName(labelEl, globalThis.document, 'drag-inner');
    }

    if (!dragState.dropType) {
      return;
    }

    dragState.dragOverNodeId = targetNodeId;
    dragState.container = event.currentTarget as HTMLElement;

    event.preventDefault();
  };

  const handleDragLeave = (event: DragEvent) => {
    if (!event.target || !event.currentTarget) return;

    const targetEl = getNodeEl(event.target as HTMLElement);

    if (!targetEl || targetEl !== event.currentTarget) return;

    const labelEl = targetEl.children[0];

    removeClassName(labelEl, 'drag-before', 'drag-after', 'drag-inner');
  };

  const handleDragEnd = (event: DragEvent, node: MNode) => {
    if (!event.target || !event.currentTarget) return;

    const targetEl = getNodeEl(event.target as HTMLElement);

    if (!targetEl || targetEl !== event.currentTarget) return;

    removeStatusClass(dragState.container);

    if (node && dragState.dragOverNodeId && dragState.dropType && services) {
      if (dragState.dragOverNodeId === node.id) {
        return;
      }

      const targetInfo = services.editorService.getNodeInfo(dragState.dragOverNodeId, false);
      const targetNode = targetInfo.node;
      let targetParent = targetInfo.parent;

      if (!targetParent || !targetNode) return;

      let targetIndex = -1;

      if (Array.isArray(targetNode.items) && dragState.dropType === 'inner') {
        targetIndex = targetNode.items.length;
        targetParent = targetNode as MContainer;
      } else {
        targetIndex = getNodeIndex(dragState.dragOverNodeId, targetParent);
      }

      if (dragState.dropType === 'after') {
        targetIndex += 1;
      }

      const selectedNodes = services.editorService.get('nodes');

      if (selectedNodes.find((n) => `${n.id}` === `${node.id}`)) {
        services.editorService.dragTo(selectedNodes, targetParent, targetIndex);
      } else {
        services.editorService.dragTo([node], targetParent, targetIndex);
      }
    }

    dragState.dragOverNodeId = '';
    dragState.dropType = '';
    dragState.container = null;
  };

  return {
    handleDragStart,
    handleDragEnd,
    handleDragLeave,
    handleDragOver,
  };
};
