/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import keybinding from '@editor/services/keybinding';
import { KeyBindingCommand } from '@editor/type';

const editorService = vi.hoisted(() => ({
  get: vi.fn(() => [{ id: 'n1', type: 'text' }]),
  remove: vi.fn(),
  copy: vi.fn(),
  paste: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  move: vi.fn(),
  selectNextNode: vi.fn(),
}));

const uiService = vi.hoisted(() => ({
  zoom: vi.fn(),
  set: vi.fn(),
  calcZoom: vi.fn(async () => 1.2),
}));

vi.mock('@editor/services/editor', () => ({ default: editorService }));
vi.mock('@editor/services/ui', () => ({ default: uiService }));

afterEach(() => {
  keybinding.reset();
  vi.clearAllMocks();
  editorService.get.mockReturnValue([{ id: 'n1', type: 'text' }]);
});

describe('keybinding service', () => {
  test('registerCommand / unregisterCommand', () => {
    const fn = vi.fn();
    keybinding.registerCommand('my-cmd', fn);
    expect((keybinding as any).commands['my-cmd']).toBe(fn);
    keybinding.unregisterCommand('my-cmd');
    expect((keybinding as any).commands['my-cmd']).toBeUndefined();
  });

  test('registeCommand / unregisteCommand 兼容别名', () => {
    const fn = vi.fn();
    keybinding.registeCommand('my-cmd-2', fn);
    expect((keybinding as any).commands['my-cmd-2']).toBe(fn);
    keybinding.unregisteCommand('my-cmd-2');
    expect((keybinding as any).commands['my-cmd-2']).toBeUndefined();
  });

  test('registerEl 不传 el 且 name !== global 时抛错', () => {
    expect(() => keybinding.registerEl('foo')).toThrow(/global/);
  });

  test('registerEl global 不需要 el', () => {
    expect(() => keybinding.registerEl('global')).not.toThrow();
  });

  test('registeEl 兼容别名', () => {
    expect(() => keybinding.registeEl('global')).not.toThrow();
  });

  test('register 同一条目去重', () => {
    keybinding.register([
      {
        command: 'cmd',
        keybinding: 'a',
        when: [['global', 'keydown']],
      } as any,
    ]);
    const before = (keybinding as any).bindingList.length;
    keybinding.register([
      {
        command: 'cmd',
        keybinding: 'a',
        when: [['global', 'keydown']],
      } as any,
    ]);
    const after = (keybinding as any).bindingList.length;
    expect(after).toBe(before);
  });

  test('unregisterEl 重置 binding bound 状态并清掉 controller', () => {
    keybinding.registerEl('global');
    keybinding.register([
      {
        command: 'cmd',
        keybinding: ['a', 'b'],
        when: [['global', 'keydown']],
      } as any,
    ]);
    keybinding.unregisterEl('global');
    expect((keybinding as any).controllers.has('global')).toBe(false);
    (keybinding as any).bindingList.forEach((item: any) => expect(item.bound).toBe(false));
  });

  test('reset 清空所有 controllers + binding', () => {
    keybinding.registerEl('global');
    keybinding.register([{ command: 'cmd', keybinding: 'a', when: [['global', 'keydown']] } as any]);
    keybinding.reset();
    expect((keybinding as any).controllers.size).toBe(0);
    expect((keybinding as any).bindingList.length).toBe(0);
  });

  test('destroy 调用 reset', () => {
    keybinding.registerEl('global');
    keybinding.destroy();
    expect((keybinding as any).controllers.size).toBe(0);
  });

  test('getKeyconKeys ctrl 在 mac 下被替换为 meta', () => {
    const original = (keybinding as any).ctrlKey;
    (keybinding as any).ctrlKey = 'meta';
    const result = (keybinding as any).getKeyconKeys('ctrl+c');
    expect(result[0]).toEqual(['meta', 'c']);
    (keybinding as any).ctrlKey = original;
  });

  test('getKeyconKeys 数组形式', () => {
    const result = (keybinding as any).getKeyconKeys(['a', 'b+c']);
    expect(result).toHaveLength(2);
  });

  test('内置 DELETE/CUT 命令在 page 节点时不执行 remove', () => {
    editorService.get.mockReturnValue([{ id: 'p1', type: 'page' }]);
    (keybinding as any).commands[KeyBindingCommand.DELETE_NODE]();
    (keybinding as any).commands[KeyBindingCommand.CUT_NODE]();
    expect(editorService.remove).not.toHaveBeenCalled();
  });

  test('内置 COPY/CUT/PASTE/UNDO/REDO 命令', () => {
    const nodes = [{ id: 'n1', type: 'text' }];
    editorService.get.mockReturnValue(nodes);
    (keybinding as any).commands[KeyBindingCommand.COPY_NODE]();
    (keybinding as any).commands[KeyBindingCommand.CUT_NODE]();
    (keybinding as any).commands[KeyBindingCommand.PASTE_NODE]();
    (keybinding as any).commands[KeyBindingCommand.UNDO]();
    (keybinding as any).commands[KeyBindingCommand.REDO]();
    expect(editorService.copy).toHaveBeenCalledWith(nodes);
    expect(editorService.remove).toHaveBeenCalledWith(nodes, { historySource: 'shortcut' });
    expect(editorService.paste).toHaveBeenCalled();
    expect(editorService.undo).toHaveBeenCalled();
    expect(editorService.redo).toHaveBeenCalled();
  });

  test('内置缩放与移动命令', async () => {
    (keybinding as any).commands[KeyBindingCommand.ZOOM_IN]();
    (keybinding as any).commands[KeyBindingCommand.ZOOM_OUT]();
    (keybinding as any).commands[KeyBindingCommand.ZOOM_RESET]();
    await (keybinding as any).commands[KeyBindingCommand.ZOOM_FIT]();
    (keybinding as any).commands[KeyBindingCommand.MOVE_UP_1]();
    (keybinding as any).commands[KeyBindingCommand.MOVE_DOWN_10]();
    (keybinding as any).commands[KeyBindingCommand.MOVE_LEFT_1]();
    (keybinding as any).commands[KeyBindingCommand.MOVE_RIGHT_10]();
    (keybinding as any).commands[KeyBindingCommand.SWITCH_NODE]();
    expect(uiService.zoom).toHaveBeenCalledWith(0.1);
    expect(uiService.zoom).toHaveBeenCalledWith(-0.1);
    expect(uiService.set).toHaveBeenCalledWith('zoom', 1);
    expect(uiService.set).toHaveBeenCalledWith('zoom', 1.2);
    expect(editorService.move).toHaveBeenCalledWith(0, -1);
    expect(editorService.move).toHaveBeenCalledWith(0, 10);
    expect(editorService.selectNextNode).toHaveBeenCalled();
  });

  test('nodes 为空时 COPY/PASTE 不执行', () => {
    editorService.get.mockReturnValue(null);
    (keybinding as any).commands[KeyBindingCommand.COPY_NODE]();
    (keybinding as any).commands[KeyBindingCommand.PASTE_NODE]();
    expect(editorService.copy).not.toHaveBeenCalled();
    expect(editorService.paste).not.toHaveBeenCalled();
  });
});
