/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useDrag } from '@editor/layouts/sidebar/layer/use-drag';

vi.mock('@editor/utils', async () => {
  const actual = await vi.importActual<any>('@editor/utils');
  return {
    ...actual,
    getNodeIndex: vi.fn(() => 0),
  };
});

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return {
    ...actual,
    addClassName: (el: any, _doc: any, className: string) => el?.classList?.add(className),
    removeClassName: (el: any, ...classNames: string[]) => {
      classNames.forEach((c) => el?.classList?.remove(c));
    },
  };
});

const makeEditorService = () => ({
  getNodeInfo: vi.fn(),
  get: vi.fn(() => []),
  dragTo: vi.fn(),
});

const buildEvent = ({
  target,
  currentTarget,
  clientY = 50,
}: {
  target?: HTMLElement;
  currentTarget?: HTMLElement;
  clientY?: number;
} = {}): DragEvent => {
  const evt = new Event('drag') as DragEvent;
  Object.defineProperty(evt, 'target', { value: target, configurable: true });
  Object.defineProperty(evt, 'currentTarget', { value: currentTarget, configurable: true });
  Object.defineProperty(evt, 'clientY', { value: clientY, configurable: true });
  Object.defineProperty(evt, 'dataTransfer', {
    value: { effectAllowed: '', setData: vi.fn() },
    configurable: true,
  });
  Object.defineProperty(evt, 'preventDefault', { value: vi.fn(), configurable: true });
  return evt;
};

const createNodeEl = (nodeId: string, isContainer = false, parentsId = '', draggable = true): HTMLElement => {
  const el = document.createElement('div');
  el.dataset.nodeId = nodeId;
  if (isContainer) el.dataset.isContainer = 'true';
  if (parentsId) el.dataset.parentsId = parentsId;
  el.draggable = draggable;
  const label = document.createElement('div');
  label.getBoundingClientRect = () =>
    ({ top: 0, height: 90, left: 0, right: 0, bottom: 0, width: 0, x: 0, y: 0, toJSON: () => null }) as any;
  el.appendChild(label);
  document.body.appendChild(el);
  return el;
};

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

describe('useDrag', () => {
  test('handleDragStart 在 currentTarget=target 时设置 dataTransfer', () => {
    const editorService = makeEditorService();
    const { handleDragStart } = useDrag({ editorService } as any);
    const el = createNodeEl('a');
    const ev = buildEvent({ target: el, currentTarget: el });
    handleDragStart(ev);
    expect((ev.dataTransfer as DataTransfer).effectAllowed).toBe('move');
    expect((ev.dataTransfer as DataTransfer).setData).toHaveBeenCalled();
  });

  test('handleDragStart target 不在 currentTarget 节点中时直接返回', () => {
    const editorService = makeEditorService();
    const { handleDragStart } = useDrag({ editorService } as any);
    const el = createNodeEl('a');
    const wrong = document.createElement('div');
    const ev = buildEvent({ target: el, currentTarget: wrong });
    handleDragStart(ev);
    expect((ev.dataTransfer as DataTransfer).setData).not.toHaveBeenCalled();
  });

  test('handleDragOver - distance < height/3 设为 before', () => {
    const editorService = makeEditorService();
    const { handleDragOver, handleDragStart } = useDrag({ editorService } as any);
    const sourceEl = createNodeEl('src');
    handleDragStart(buildEvent({ target: sourceEl, currentTarget: sourceEl }));
    const targetEl = createNodeEl('tgt');
    const ev = buildEvent({ target: targetEl, currentTarget: targetEl, clientY: 5 });
    handleDragOver(ev);
    expect(ev.preventDefault as any).toHaveBeenCalled();
    expect(targetEl.children[0].classList.contains('drag-before')).toBe(true);
  });

  test('handleDragOver - distance > height*2/3 设为 after', () => {
    const editorService = makeEditorService();
    const { handleDragOver, handleDragStart } = useDrag({ editorService } as any);
    const sourceEl = createNodeEl('src');
    handleDragStart(buildEvent({ target: sourceEl, currentTarget: sourceEl }));
    const targetEl = createNodeEl('tgt');
    const ev = buildEvent({ target: targetEl, currentTarget: targetEl, clientY: 80 });
    handleDragOver(ev);
    expect(targetEl.children[0].classList.contains('drag-after')).toBe(true);
  });

  test('handleDragOver - 中部且为容器时设为 inner', () => {
    const editorService = makeEditorService();
    const { handleDragOver, handleDragStart } = useDrag({ editorService } as any);
    const sourceEl = createNodeEl('src');
    handleDragStart(buildEvent({ target: sourceEl, currentTarget: sourceEl }));
    const targetEl = createNodeEl('tgt', true);
    const ev = buildEvent({ target: targetEl, currentTarget: targetEl, clientY: 45 });
    handleDragOver(ev);
    expect(targetEl.children[0].classList.contains('drag-inner')).toBe(true);
  });

  test('handleDragOver - 父节点 includes nodeId 时返回', () => {
    const editorService = makeEditorService();
    const { handleDragOver, handleDragStart } = useDrag({ editorService } as any);
    const sourceEl = createNodeEl('src');
    handleDragStart(buildEvent({ target: sourceEl, currentTarget: sourceEl }));
    const targetEl = createNodeEl('tgt', false, 'src,grand');
    const ev = buildEvent({ target: targetEl, currentTarget: targetEl, clientY: 5 });
    handleDragOver(ev);
    expect(targetEl.children[0].classList.contains('drag-before')).toBe(false);
  });

  test('handleDragOver - canDropIn 返回 false 时禁止 inner', () => {
    const editorService = makeEditorService();
    const canDropIn = vi.fn(() => false);
    const { handleDragOver, handleDragStart } = useDrag({ editorService } as any, { canDropIn });
    const sourceEl = createNodeEl('src');
    handleDragStart(buildEvent({ target: sourceEl, currentTarget: sourceEl }));
    const targetEl = createNodeEl('tgt', true);
    const ev = buildEvent({ target: targetEl, currentTarget: targetEl, clientY: 45 });
    handleDragOver(ev);
    expect(targetEl.children[0].classList.contains('drag-inner')).toBe(false);
  });

  test('handleDragOver - canDropIn 返回 id 时记录 redirectedTargetId', () => {
    const editorService = makeEditorService();
    const canDropIn = vi.fn(() => 'redirected-id');
    const { handleDragOver, handleDragStart } = useDrag({ editorService } as any, { canDropIn });
    const sourceEl = createNodeEl('src');
    handleDragStart(buildEvent({ target: sourceEl, currentTarget: sourceEl }));
    const targetEl = createNodeEl('tgt', true);
    const ev = buildEvent({ target: targetEl, currentTarget: targetEl, clientY: 45 });
    handleDragOver(ev);
    expect(targetEl.children[0].classList.contains('drag-inner')).toBe(true);
  });

  test('handleDragLeave 移除 class', () => {
    const editorService = makeEditorService();
    const { handleDragLeave } = useDrag({ editorService } as any);
    const targetEl = createNodeEl('tgt');
    const labelEl = targetEl.children[0];
    labelEl.classList.add('drag-before');
    handleDragLeave(buildEvent({ target: targetEl, currentTarget: targetEl }));
    expect(labelEl.classList.contains('drag-before')).toBe(false);
  });

  test('handleDragEnd - inner 时设置 targetIndex 为 items.length', () => {
    const editorService = makeEditorService();
    const targetNode = { id: 'tgt', items: [{}, {}] };
    editorService.getNodeInfo.mockReturnValue({ node: targetNode, parent: { id: 'p' } });
    const { handleDragOver, handleDragStart, handleDragEnd } = useDrag({ editorService } as any);
    const sourceEl = createNodeEl('src');
    handleDragStart(buildEvent({ target: sourceEl, currentTarget: sourceEl }));
    const targetEl = createNodeEl('tgt', true);
    handleDragOver(buildEvent({ target: targetEl, currentTarget: targetEl, clientY: 45 }));

    handleDragEnd(buildEvent({ target: sourceEl, currentTarget: sourceEl }), { id: 'src' } as any);
    expect(editorService.dragTo).toHaveBeenCalledWith([{ id: 'src' }], targetNode, 2);
  });

  test('handleDragEnd - dropType 为 after 时 index+1', () => {
    const editorService = makeEditorService();
    editorService.getNodeInfo.mockReturnValue({ node: { id: 'tgt' }, parent: { id: 'p', items: [] } });
    const { handleDragOver, handleDragStart, handleDragEnd } = useDrag({ editorService } as any);
    const sourceEl = createNodeEl('src');
    handleDragStart(buildEvent({ target: sourceEl, currentTarget: sourceEl }));
    const targetEl = createNodeEl('tgt');
    handleDragOver(buildEvent({ target: targetEl, currentTarget: targetEl, clientY: 80 }));
    handleDragEnd(buildEvent({ target: sourceEl, currentTarget: sourceEl }), { id: 'src' } as any);
    expect(editorService.dragTo).toHaveBeenCalledWith([{ id: 'src' }], { id: 'p', items: [] }, 1);
  });

  test('handleDragEnd - dragOverNodeId 等于 node.id 时返回', () => {
    const editorService = makeEditorService();
    const { handleDragOver, handleDragStart, handleDragEnd } = useDrag({ editorService } as any);
    const sourceEl = createNodeEl('src');
    handleDragStart(buildEvent({ target: sourceEl, currentTarget: sourceEl }));
    const targetEl = createNodeEl('src', true);
    handleDragOver(buildEvent({ target: targetEl, currentTarget: targetEl, clientY: 45 }));
    handleDragEnd(buildEvent({ target: sourceEl, currentTarget: sourceEl }), { id: 'src' } as any);
    expect(editorService.dragTo).not.toHaveBeenCalled();
  });

  test('handleDragEnd - canDropIn 返回 redirectedId 时使用重定向', () => {
    const editorService = makeEditorService();
    const targetNode = { id: 'tgt', items: [] };
    const redirectedNode = { id: 'red', items: [{}] };
    editorService.getNodeInfo.mockImplementation((id: string) => {
      if (id === 'red') return { node: redirectedNode };
      return { node: targetNode, parent: { id: 'p' } };
    });
    const canDropIn = vi.fn(() => 'red');
    const { handleDragOver, handleDragStart, handleDragEnd } = useDrag({ editorService } as any, { canDropIn });
    const sourceEl = createNodeEl('src');
    handleDragStart(buildEvent({ target: sourceEl, currentTarget: sourceEl }));
    const targetEl = createNodeEl('tgt', true);
    handleDragOver(buildEvent({ target: targetEl, currentTarget: targetEl, clientY: 45 }));
    handleDragEnd(buildEvent({ target: sourceEl, currentTarget: sourceEl }), { id: 'src' } as any);
    expect(editorService.dragTo).toHaveBeenCalledWith([{ id: 'src' }], redirectedNode, 1);
  });

  test('handleDragEnd - selectedNodes 包含 node 时使用 selectedNodes', () => {
    const editorService = makeEditorService();
    editorService.getNodeInfo.mockReturnValue({ node: { id: 'tgt' }, parent: { id: 'p', items: [] } });
    editorService.get.mockReturnValue([{ id: 'src' }, { id: 'sib' }]);
    const { handleDragOver, handleDragStart, handleDragEnd } = useDrag({ editorService } as any);
    const sourceEl = createNodeEl('src');
    handleDragStart(buildEvent({ target: sourceEl, currentTarget: sourceEl }));
    const targetEl = createNodeEl('tgt');
    handleDragOver(buildEvent({ target: targetEl, currentTarget: targetEl, clientY: 5 }));
    handleDragEnd(buildEvent({ target: sourceEl, currentTarget: sourceEl }), { id: 'src' } as any);
    expect(editorService.dragTo).toHaveBeenCalledWith([{ id: 'src' }, { id: 'sib' }], expect.anything(), 0);
  });
});
