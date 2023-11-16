import type { Id, MContainer, MNode } from '@tmagic/schema';
import { addClassName, removeClassName } from '@tmagic/utils';

import { DragType, type Services } from '@editor/type';
import { getNodeIndex } from '@editor/utils';

export declare type NodeDropType = 'before' | 'after' | 'inner' | 'none';

const dragState: {
  dragOverNodeId: Id;
  dropType: NodeDropType | '';
  container: HTMLElement | null;
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

    const { top: targetTop, height: targetHeight } = labelEl.getBoundingClientRect();

    const distance = event.clientY - targetTop;
    const isContainer = targetEl.dataset.isContainer === 'true';

    if (distance < targetHeight / 3) {
      dragState.dropType = 'before';
      addClassName(labelEl, globalThis.document, 'drag-before');
      removeClassName(labelEl, 'drag-after', 'drag-inner');
    } else if (distance > (targetHeight * 2) / 3) {
      dragState.dropType = 'after';
      addClassName(labelEl, globalThis.document, 'drag-after');
      removeClassName(labelEl, 'drag-before', 'drag-inner');
    } else if (isContainer) {
      dragState.dropType = 'inner';
      addClassName(labelEl, globalThis.document, 'drag-inner');
      removeClassName(labelEl, 'drag-before', 'drag-after');
    }

    if (!dragState.dropType) {
      return;
    }

    dragState.dragOverNodeId = targetEl.dataset.nodeId || '';
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

      services?.editorService.dragTo(node, targetParent, targetIndex);
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
