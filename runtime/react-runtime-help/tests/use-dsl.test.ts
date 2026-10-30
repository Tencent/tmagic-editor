import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import TMagicApp, { NodeType } from '@tmagic/core';

import { useDsl } from '../src/hooks/use-dsl';

/**
 * 最小化的 react hooks 运行时（react-dom 没有安装在该包中）：
 * 支持 useState / useRef / useEffect（含 deps 与 cleanup），渲染由测试手动触发
 */
const runtime = vi.hoisted(() => {
  interface Instance {
    hooks: any[];
    index: number;
    effects: { deps?: any[]; cleanup?: () => void; fn: () => void | (() => void) }[];
    pending: (() => void)[];
  }
  const state: { current: Instance | null } = { current: null };
  return { state };
});

vi.mock('react', () => ({
  useState: (init: any) => {
    const inst = runtime.state.current!;
    const i = inst.index;
    inst.index += 1;
    if (!(i in inst.hooks)) inst.hooks[i] = init;
    return [inst.hooks[i], (v: any) => (inst.hooks[i] = v)];
  },
  useRef: (init: any) => {
    const inst = runtime.state.current!;
    const i = inst.index;
    inst.index += 1;
    if (!(i in inst.hooks)) inst.hooks[i] = { current: init };
    return inst.hooks[i];
  },
  useEffect: (fn: () => void | (() => void), deps?: any[]) => {
    const inst = runtime.state.current!;
    const i = inst.index;
    inst.index += 1;
    const prev = inst.effects[i];
    const changed = !prev || !deps || !prev.deps || deps.some((d, k) => d !== prev.deps![k]);
    if (changed) {
      inst.pending.push(() => {
        prev?.cleanup?.();
        const cleanup = fn();
        inst.effects[i] = { deps, fn, cleanup: typeof cleanup === 'function' ? cleanup : undefined };
      });
    } else {
      inst.effects[i] = prev;
    }
  },
}));

const mountHook = (app: TMagicApp | undefined) => {
  const inst = { hooks: [] as any[], index: 0, effects: [] as any[], pending: [] as (() => void)[] };
  let result: ReturnType<typeof useDsl>;
  const render = () => {
    inst.index = 0;
    runtime.state.current = inst;
    result = useDsl(app);
    runtime.state.current = null;
    inst.pending.splice(0).forEach((run) => run());
    return result;
  };
  const unmount = () => inst.effects.forEach((e) => e?.cleanup?.());
  return {
    render,
    unmount,
    get result() {
      return result;
    },
  };
};

const createApp = () =>
  new TMagicApp({
    platform: 'mobile',
    config: {
      type: NodeType.ROOT,
      id: 'app',
      items: [
        { type: NodeType.PAGE, id: 'p1', items: [{ id: 'n1', type: 'text', text: 'p1 ${ds.name}' }] },
        { type: NodeType.PAGE, id: 'p2', items: [{ id: 'n2', type: 'text', text: 'p2 ${ds.name}' }] },
      ],
      dataSourceDeps: { ds: { n1: { name: 'n1', keys: ['text'] }, n2: { name: 'n2', keys: ['text'] } } },
      dataSources: [{ id: 'ds', type: 'base', fields: [{ name: 'name', defaultValue: 'x' }], methods: [], events: [] }],
    } as any,
  });

describe('react useDsl', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('多次重渲染只保留一个 page-change / update-data 监听，卸载后清理', () => {
    const app = createApp();
    const hook = mountHook(app);
    for (let i = 0; i < 5; i++) hook.render();

    expect(app.listenerCount('page-change')).toBe(1);
    expect(app.dataSourceManager!.listenerCount('update-data')).toBe(1);

    hook.unmount();
    expect(app.listenerCount('page-change')).toBe(0);
    expect(app.dataSourceManager!.listenerCount('update-data')).toBe(0);
  });

  test('换页后数据源更新，处理的是当前页面而不是首次渲染时的页面', () => {
    const app = createApp();
    const hook = mountHook(app);
    hook.render();
    expect(hook.result.pageConfig?.id).toBe('p1');

    app.setPage('p2');
    expect(hook.render().pageConfig?.id).toBe('p2');

    app.dataSourceManager!.get('ds')!.setData('NEW', 'name');
    const { pageConfig } = hook.render();

    expect(pageConfig?.id).toBe('p2');
    expect((pageConfig as any).items[0].text).toBe('p2 NEW');
  });

  test('连续多次更新都基于最新配置', () => {
    const app = createApp();
    const hook = mountHook(app);
    hook.render();

    const ds = app.dataSourceManager!.get('ds')!;
    ds.setData('A', 'name');
    ds.setData('B', 'name');
    expect((hook.render().pageConfig as any).items[0].text).toBe('p1 B');
  });

  test('非当前页面（页面片等）的 update-data 被忽略', () => {
    const app = createApp();
    const hook = mountHook(app);
    const before = hook.render().pageConfig;
    const replaced = vi.fn();
    app.on('replaced-node', replaced);

    app.dataSourceManager!.emit(
      'update-data',
      [{ id: 'n1', type: 'text', text: 'OTHER' }],
      'ds',
      { updateData: 1 },
      'p2',
    );
    vi.runAllTimers();

    expect(hook.render().pageConfig).toBe(before);
    expect(replaced).not.toHaveBeenCalled();
  });

  test('更新后异步发出 replaced-node', () => {
    const app = createApp();
    const hook = mountHook(app);
    hook.render();
    const replaced = vi.fn();
    app.on('replaced-node', replaced);

    app.dataSourceManager!.get('ds')!.setData('Z', 'name');
    expect(replaced).not.toHaveBeenCalled();
    vi.runAllTimers();

    expect(replaced).toHaveBeenCalledTimes(1);
    expect(replaced.mock.calls[0][0].sourceId).toBe('ds');
    expect(replaced.mock.calls[0][0].nodes[0].id).toBe('n1');
  });

  test('同一份已编译节点的多次 update-data 只替换一次，但 replaced-node 每次都发', () => {
    const app = createApp();
    const hook = mountHook(app);
    hook.render();
    const replaced = vi.fn();
    app.on('replaced-node', replaced);

    const node: any = { id: 'n1', type: 'text', text: 'NEW' };

    app.dataSourceManager!.emit('update-data', [node], 'ds', { updateData: 'a' }, 'p1');
    const afterFirst = hook.render().pageConfig;

    app.dataSourceManager!.emit('update-data', [node], 'ds', { updateData: 'b' }, 'p1');
    const afterSecond = hook.render().pageConfig;

    // 第二个事件没有新节点需要替换，不再 cloneDeep / setPageConfig
    expect(afterSecond).toBe(afterFirst);
    expect((afterSecond as any).items[0].text).toBe('NEW');

    vi.runAllTimers();
    expect(replaced).toHaveBeenCalledTimes(2);
  });

  test('app 或 dataSourceManager 不存在时不报错', () => {
    expect(() => mountHook(undefined).render()).not.toThrow();

    const app = new TMagicApp({});
    const hook = mountHook(app);
    expect(() => hook.render()).not.toThrow();
    expect(app.listenerCount('page-change')).toBe(1);
    hook.unmount();
  });
});
