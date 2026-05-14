/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { NodeType } from '@tmagic/core';

import editorService from '@editor/services/editor';
import propsService from '@editor/services/props';
import { beforePaste, getAddParent, getDefaultConfig, getPositionInContainer } from '@editor/utils/operator';

const { editorState } = vi.hoisted(() => {
  const state: Record<string, any> = {};
  return { editorState: state };
});

vi.mock('@editor/services/editor', () => ({
  default: {
    get: (k: string) => editorState[k],
    getParentById: vi.fn((id: string) => ({ id: `parent-of-${id}`, items: [] })),
    getLayout: vi.fn(async () => 'absolute'),
  },
}));

vi.mock('@editor/services/props', () => ({
  default: {
    setNewItemId: vi.fn((node: any) => ({ ...node, id: `new-${node.id}` })),
    getPropsValue: vi.fn(async (type: string, cfg: any) => ({ type, ...cfg })),
  },
}));

vi.mock('@tmagic/utils', async () => {
  const actual = (await vi.importActual('@tmagic/utils')) as Record<string, unknown>;
  return {
    ...actual,
    calcValueByFontsize: (_doc: any, val: number) => val,
    getElById: () => () => ({
      getBoundingClientRect: () => ({ left: 5, top: 7 }),
    }),
  };
});

beforeEach(() => {
  Object.keys(editorState).forEach((k) => delete editorState[k]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('operator.beforePaste', () => {
  test('config[0] 无 style 时直接返回原数组', () => {
    const config = [{ id: 'a', type: 'text' }] as any;
    expect(beforePaste({}, config)).toBe(config);
  });

  test('正常路径：基于第一个元素重定位坐标，并 setNewItemId', () => {
    const config = [
      { id: 'n1', type: 'text', style: { left: 10, top: 20 } },
      { id: 'n2', type: 'text', style: { left: 30, top: 50 } },
    ] as any;

    const result = beforePaste({ left: 100, top: 200, offsetX: 5, offsetY: 6 } as any, config);

    expect(result[0].id).toBe('new-n1');
    expect(result[0].style.left).toBe(100);
    expect(result[0].style.top).toBe(200);
    expect(result[1].style.left).toBe(120);
    expect(result[1].style.top).toBe(230);
  });

  test('粘贴时选中容器：将坐标换算到容器内', () => {
    editorState.node = { id: 'container', items: [] };
    editorState.stage = {
      renderer: { contentWindow: { document: {} } },
    };
    const config = [{ id: 'n1', type: 'text', style: { left: 10, top: 20 } }] as any;
    const result = beforePaste({ left: 100, top: 200 } as any, config);
    expect(result[0].style.left).toBe(95);
    expect(result[0].style.top).toBe(193);
  });

  test('页面节点粘贴时，会通过 generatePageNameByApp 重命名', () => {
    editorState.root = { id: 'app', type: NodeType.ROOT, items: [{ name: 'page_1' }] };
    const config = [{ id: 'p1', type: NodeType.PAGE, style: { left: 0, top: 0 }, name: 'old' }] as any;
    const result = beforePaste({}, config);
    expect((result[0] as any).type).toBe(NodeType.PAGE);
    expect((result[0] as any).name).toMatch(/page_/);
  });

  test('粘贴片段节点时也会被重命名', () => {
    editorState.root = { id: 'app', type: NodeType.ROOT, items: [] };
    const config = [{ id: 'pf1', type: NodeType.PAGE_FRAGMENT, style: { left: 0, top: 0 }, name: 'pf' }] as any;
    const result = beforePaste({}, config);
    expect((result[0] as any).name).toMatch(/^page-fragment_/);
  });

  test('style.left/top 为字符串数字时也会做偏移', () => {
    const config = [{ id: 'n1', type: 'text', style: { left: '10', top: '20' } }] as any;
    const result = beforePaste({ offsetX: 3, offsetY: 4 } as any, config);
    expect(result[0].style.left).toBe(13);
    expect(result[0].style.top).toBe(24);
  });

  test('style.left/top 不能转换为数字时保持原值', () => {
    const config = [{ id: 'n1', type: 'text', style: { left: 'abc', top: 'xyz' } }] as any;
    const result = beforePaste({ offsetX: 3, offsetY: 4 } as any, config);
    expect(result[0].style.left).toBe('abc');
    expect(result[0].style.top).toBe('xyz');
  });

  test('pasteConfig 没有 style 时不会出错', () => {
    const original = (propsService.setNewItemId as any).getMockImplementation();
    (propsService.setNewItemId as any).mockImplementationOnce((node: any) => ({
      ...node,
      id: 'new',
      style: undefined,
    }));
    const config = [{ id: 'n1', type: 'text', style: { left: 0, top: 0 } }] as any;
    const result = beforePaste({}, config);
    expect(result[0].style).toBeUndefined();
    if (original) (propsService.setNewItemId as any).mockImplementation(original);
  });
});

describe('operator.getPositionInContainer', () => {
  test('未提供 stage 时仅返回原始坐标', () => {
    editorState.stage = undefined;
    const pos = getPositionInContainer({ left: 10, top: 20 }, 'x');
    expect(pos).toEqual({ left: 10, top: 20 });
  });

  test('stage 中找到元素后做偏移修正', () => {
    editorState.stage = { renderer: { contentWindow: { document: {} } } };
    const pos = getPositionInContainer({ left: 100, top: 200 }, 'id');
    expect(pos).toEqual({ left: 95, top: 193 });
  });

  test('未传 position 时使用默认 0', () => {
    editorState.stage = undefined;
    const pos = getPositionInContainer(undefined, 'id');
    expect(pos).toEqual({ left: 0, top: 0 });
  });
});

describe('operator.getAddParent', () => {
  test('页面节点：parent 为 root', () => {
    editorState.root = { id: 'app', items: [] };
    editorState.node = { id: 'cur' };
    const parent = getAddParent({ id: 'p1', type: NodeType.PAGE } as any);
    expect(parent).toEqual(editorState.root);
  });

  test('当前选中容器：直接返回容器', () => {
    editorState.node = { id: 'container', items: [] };
    const parent = getAddParent({ id: 'n1', type: 'text' } as any);
    expect(parent).toEqual(editorState.node);
  });

  test('当前选中节点不是容器：通过 getParentById 找父节点', () => {
    editorState.node = { id: 'leaf' };
    const parent = getAddParent({ id: 'n1', type: 'text' } as any);
    expect((parent as any).id).toBe('parent-of-leaf');
  });

  test('curNode 为空时返回 undefined', () => {
    expect(getAddParent({ id: 'n1', type: 'text' } as any)).toBeUndefined();
  });
});

describe('operator.getDefaultConfig', () => {
  test('合并 layout 与 propsService 返回值', async () => {
    const newNode = await getDefaultConfig({ type: 'text', x: 1 } as any, { id: 'parent', items: [] } as any);
    expect(newNode.type).toBe('text');
    expect(editorService.getLayout).toHaveBeenCalled();
    expect(newNode.style).toBeDefined();
  });
});
