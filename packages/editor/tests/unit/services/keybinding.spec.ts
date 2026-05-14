/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import keybinding from '@editor/services/keybinding';

afterEach(() => {
  keybinding.reset();
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
});
