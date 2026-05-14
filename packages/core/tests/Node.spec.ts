/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';

import { type MApp, NodeType } from '@tmagic/schema';

import App from '../src/App';
import Node from '../src/Node';

const baseDsl = (): MApp => ({
  type: NodeType.ROOT,
  id: 'app',
  items: [
    {
      type: NodeType.PAGE,
      id: 'p1',
      items: [{ id: 'btn', type: 'button' }],
    },
  ],
});

describe('Node 基础', () => {
  test('实例化时初始化 events / style 默认值', () => {
    const app = new App({ config: baseDsl() });
    const node = app.page!.getNode('btn')!;
    expect(node).toBeInstanceOf(Node);
    expect(node.events).toEqual([]);
    expect(node.style).toEqual({});
  });

  test('setData 更新 events / style 并触发 update-data 事件', () => {
    const app = new App({ config: baseDsl() });
    const node = app.page!.getNode('btn')!;
    const handler = vi.fn();
    node.on('update-data', handler);
    node.setData({
      id: 'btn',
      type: 'button',
      events: [{ name: 'click', actions: [] }],
      style: { color: 'red' },
    } as any);
    expect(handler).toHaveBeenCalled();
    expect(node.events).toHaveLength(1);
    expect(node.style.color).toBe('red');
  });

  test('setInstance 与 setData 同步实例的 config', () => {
    const app = new App({ config: baseDsl() });
    const node = app.page!.getNode('btn')!;
    const instance: any = {};
    node.setInstance(instance);
    node.setData({ id: 'btn', type: 'button', text: 'changed' } as any);
    expect(instance.config?.text).toBe('changed');
  });

  test('frozen instance 时 setData 不抛错', () => {
    const app = new App({ config: baseDsl() });
    const node = app.page!.getNode('btn')!;
    const frozen = Object.freeze({ __isVue: false });
    node.setInstance(frozen);
    expect(() => node.setData({ id: 'btn', type: 'button' } as any)).not.toThrow();
  });

  test('addEventToQueue 入队', () => {
    const app = new App({ config: baseDsl() });
    const node = app.page!.getNode('btn')!;
    node.addEventToQueue({ method: 'm', fromCpt: null, args: [1, 2] });
    expect((node as any).eventQueue).toHaveLength(1);
  });

  test('registerMethod (deprecated) 注入实例方法', () => {
    const app = new App({ config: baseDsl() });
    const node = app.page!.getNode('btn')!;
    node.registerMethod({ doIt: () => 'ok', notFn: 'x' as any });
    expect(node.instance.doIt()).toBe('ok');
    expect(node.instance.notFn).toBeUndefined();
    node.registerMethod(undefined as any);
  });

  test('runHookCode 函数式回退', async () => {
    const app = new App({ config: baseDsl() });
    const node = app.page!.getNode('btn')!;
    const fn = vi.fn();
    (node.data as any).created = fn;
    await node.runHookCode('created');
    expect(fn).toHaveBeenCalledWith(node);
  });

  test('runHookCode 数据格式不匹配时不报错', async () => {
    const app = new App({ config: baseDsl() });
    const node = app.page!.getNode('btn')!;
    (node.data as any).onSomething = { hookType: 'other' };
    await expect(node.runHookCode('onSomething')).resolves.toBeUndefined();
  });

  test('destroy 清理状态与监听', () => {
    const app = new App({ config: baseDsl() });
    const node = app.page!.getNode('btn')!;
    const handler = vi.fn();
    node.on('test', handler);
    node.destroy();
    node.emit('test');
    expect(handler).not.toHaveBeenCalled();
    expect(node.instance).toBeNull();
    expect(node.events).toEqual([]);
  });

  test('created/destroy 生命周期触发 hook', async () => {
    const app = new App({ config: baseDsl() });
    const codeFn = vi.fn();
    app.codeDsl = {
      hello: { name: 'hello', content: codeFn, params: [] },
    } as any;
    const node = app.page!.getNode('btn')!;
    (node.data as any).created = {
      hookType: 'code',
      hookData: [{ codeId: 'hello', params: {} }],
    };
    node.emit('created', null);
    await new Promise((r) => setTimeout(r, 0));
    expect(codeFn).toHaveBeenCalled();
  });
});
