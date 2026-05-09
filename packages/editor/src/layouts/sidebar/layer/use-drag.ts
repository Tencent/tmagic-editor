import type { Id, MContainer, MNode } from '@tmagic/core';
import { addClassName, removeClassName } from '@tmagic/utils';

import { DragType, type Services } from '@editor/type';
import { getNodeIndex } from '@editor/utils';

export declare type NodeDropType = 'before' | 'after' | 'inner' | 'none';

const dragState: {
  dragOverNodeId: Id;
  dropType: NodeDropType | '';
  container: HTMLElement | null;
  nodeId?: Id;
  /** canDropIn 返回 Id 时记录的重定向目标 id，handleDragEnd 阶段会改用该 id 对应的节点作为 inner 拖入的父节点 */
  redirectedTargetId?: Id;
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

export interface UseDragOptions {
  /**
   * 用于判断某个节点是否能被拖动到另一个节点内部
   * - 返回 `false`：阻止 inner 拖入（before/after 仍然可用）
   * - 返回 `Id`：将 inner 拖入的目标重定向到该 id 对应的节点
   * - 其他：按原 targetId 正常拖入
   */
  canDropIn?: (sourceIds: Id[], targetId: Id) => Id | boolean | void;
}

/**
 * dragstart/dragleave/dragend 属于源节点
 * dragover 属于目标节点
 * 这些方法并不是同一个dom事件触发的
 */
export const useDrag = ({ editorService }: Services, options: UseDragOptions = {}) => {
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

    // 通过用户配置的钩子判断当前拖动节点是否允许拖入目标节点内部
    //   - false：禁止 inner 拖入
    //   - Id   ：将 inner 拖入的父节点重定向为该 id 对应的节点
    //   - 其他：按原 targetNodeId 正常拖入
    let canDropInTarget = isContainer;
    let redirectedTargetId: Id | undefined;
    if (canDropInTarget && options.canDropIn && nodeId && targetNodeId !== nodeId) {
      const result = options.canDropIn([nodeId], targetNodeId);
      if (result === false) {
        canDropInTarget = false;
      } else if (typeof result === 'string' || typeof result === 'number') {
        redirectedTargetId = result;
      }
    }

    // before/after 模式下新节点会成为 target 的兄弟（即 target 的直接父节点的子节点），
    // 所以应该用 target 的直接父节点 id 再次调用 canDropIn 校验。
    // 若该父节点禁止拖入（false）或要求重定向（Id），都视为"不应放入此父节点"，
    // 故对应的 before/after 也禁用——避免绕过 inner 限制。
    let canDropAsSibling = true;
    const directParentId = parentsId?.[parentsId.length - 1];
    if (options.canDropIn && nodeId && directParentId && directParentId !== nodeId) {
      const siblingResult = options.canDropIn([nodeId], directParentId);
      if (siblingResult === false || typeof siblingResult === 'string' || typeof siblingResult === 'number') {
        canDropAsSibling = false;
      }
    }

    // 显式重置 dropType，避免上一次 dragover 的残留值影响本次判断
    dragState.dropType = '';
    if (distance < targetHeight / 3 && canDropAsSibling) {
      dragState.dropType = 'before';
      addClassName(labelEl, globalThis.document, 'drag-before');
    } else if (distance > (targetHeight * 2) / 3 && canDropAsSibling) {
      dragState.dropType = 'after';
      addClassName(labelEl, globalThis.document, 'drag-after');
    } else if (canDropInTarget) {
      dragState.dropType = 'inner';
      addClassName(labelEl, globalThis.document, 'drag-inner');
    }

    if (!dragState.dropType) {
      return;
    }

    dragState.dragOverNodeId = targetNodeId;
    dragState.container = event.currentTarget as HTMLElement;
    // 仅 inner 时才使用重定向，before/after 是相对于 dragOverNodeId 的兄弟插入，重定向无意义
    dragState.redirectedTargetId = dragState.dropType === 'inner' ? redirectedTargetId : undefined;

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

    if (node && dragState.dragOverNodeId && dragState.dropType) {
      if (dragState.dragOverNodeId === node.id) {
        return;
      }

      const targetInfo = editorService.getNodeInfo(dragState.dragOverNodeId, false);
      const targetNode = targetInfo.node;
      let targetParent = targetInfo.parent;

      if (!targetParent || !targetNode) return;

      let targetIndex = -1;

      if (Array.isArray(targetNode.items) && dragState.dropType === 'inner') {
        // 优先使用 canDropIn 返回的重定向 id 对应的节点作为父节点
        if (dragState.redirectedTargetId !== undefined) {
          const redirectedNode = editorService.getNodeInfo(dragState.redirectedTargetId, false).node;
          if (!redirectedNode || !Array.isArray((redirectedNode as MContainer).items)) {
            // 重定向目标无效或不是容器，放弃此次拖入
            return;
          }
          targetParent = redirectedNode as MContainer;
          targetIndex = (redirectedNode as MContainer).items!.length;
        } else {
          targetIndex = targetNode.items.length;
          targetParent = targetNode as MContainer;
        }
      } else {
        targetIndex = getNodeIndex(dragState.dragOverNodeId, targetParent);
      }

      if (dragState.dropType === 'after') {
        targetIndex += 1;
      }

      const selectedNodes = editorService.get('nodes');

      if (selectedNodes.find((n) => `${n.id}` === `${node.id}`)) {
        editorService.dragTo(selectedNodes, targetParent, targetIndex);
      } else {
        editorService.dragTo([node], targetParent, targetIndex);
      }
    }

    dragState.dragOverNodeId = '';
    dragState.dropType = '';
    dragState.container = null;
    dragState.redirectedTargetId = undefined;
  };

  return {
    handleDragStart,
    handleDragEnd,
    handleDragLeave,
    handleDragOver,
  };
};
