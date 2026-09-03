/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import { DepTargetType } from '@tmagic/core';
import { getNodes } from '@tmagic/utils';

import { initServiceEvents, initServiceState } from '@editor/initService';
import * as logger from '@editor/utils/logger';

const mkServices = () => {
  const handlers: Record<string, Record<string, any[]>> = {};
  const mkSvc = (name: string) => {
    handlers[name] = {};
    const svc = {
      on: vi.fn((event: string, cb: any) => {
        handlers[name][event] = handlers[name][event] || [];
        handlers[name][event].push(cb);
      }),
      off: vi.fn((event: string, cb: any) => {
        handlers[name][event] = (handlers[name][event] || []).filter((h) => h !== cb);
      }),
      emit: (event: string, ...args: any[]) => {
        (handlers[name][event] || []).forEach((cb) => cb(...args));
      },
    };
    return svc;
  };

  const editorService: any = {
    ...mkSvc('editor'),
    state: {} as any,
    set: vi.fn((k: string, v: any) => (editorService.state[k] = v)),
    get: vi.fn((k: string) => editorService.state[k]),
    select: vi.fn(),
    getNodeInfo: vi.fn(() => ({ page: { id: 'p1' } })),
    getNodeById: vi.fn(),
    getParentById: vi.fn(),
    resetState: vi.fn(),
  };
  const historyService: any = { ...mkSvc('history'), resetState: vi.fn() };
  const componentListService: any = {
    ...mkSvc('componentList'),
    setList: vi.fn(),
    resetState: vi.fn(),
  };
  const propsService: any = {
    ...mkSvc('props'),
    setPropsConfigs: vi.fn(),
    setPropsValues: vi.fn(),
    setDisabledCodeBlock: vi.fn(),
    setDisabledDataSource: vi.fn(),
    resetState: vi.fn(),
  };
  const eventsService: any = {
    ...mkSvc('events'),
    setEvents: vi.fn(),
    setMethods: vi.fn(),
    resetState: vi.fn(),
  };
  const uiService: any = {
    ...mkSvc('ui'),
    set: vi.fn(),
    resetState: vi.fn(),
  };
  const codeBlockService: any = {
    ...mkSvc('codeBlock'),
    setCodeDsl: vi.fn(),
    resetState: vi.fn(),
  };
  const keybindingService: any = { ...mkSvc('kb'), reset: vi.fn() };
  const dataSourceService: any = {
    ...mkSvc('dataSource'),
    state: {} as any,
    set: vi.fn((k: string, v: any) => (dataSourceService.state[k] = v)),
    get: vi.fn((k: string) => dataSourceService.state[k]),
    setFormConfig: vi.fn(),
    setFormValue: vi.fn(),
    setFormEvent: vi.fn(),
    setFormMethod: vi.fn(),
  };
  const depService: any = {
    ...mkSvc('dep'),
    addTarget: vi.fn(),
    removeTarget: vi.fn(),
    getTargets: vi.fn(() => ({})),
    getTarget: vi.fn(),
    hasTarget: vi.fn(() => false),
    clear: vi.fn(),
    clearTargets: vi.fn(),
    clearIdleTasks: vi.fn(),
    collectIdle: vi.fn(async () => true),
    collectByWorker: vi.fn(async () => undefined),
    reset: vi.fn(),
  };
  const stageOverlayService: any = mkSvc('stageOverlay');

  return {
    editorService,
    historyService,
    componentListService,
    propsService,
    eventsService,
    uiService,
    codeBlockService,
    keybindingService,
    dataSourceService,
    depService,
    stageOverlayService,
    handlers,
  };
};

vi.mock('@tmagic/core', async () => {
  const actual = await vi.importActual<any>('@tmagic/core');
  return {
    ...actual,
    createCodeBlockTarget: vi.fn((id: any, c: any) => ({
      id,
      type: actual.DepTargetType.CODE_BLOCK,
      deps: {},
      name: c?.name,
    })),
    createDataSourceTarget: vi.fn((ds: any) => ({ id: ds.id, type: actual.DepTargetType.DATA_SOURCE, deps: {} })),
    createDataSourceCondTarget: vi.fn((ds: any) => ({
      id: ds.id,
      type: actual.DepTargetType.DATA_SOURCE_COND,
      deps: {},
    })),
    createDataSourceMethodTarget: vi.fn((ds: any) => ({
      id: ds.id,
      type: actual.DepTargetType.DATA_SOURCE_METHOD,
      deps: {},
    })),
    updateNode: vi.fn(),
  };
});

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return {
    ...actual,
    getDepNodeIds: vi.fn(() => []),
    getNodes: vi.fn(() => []),
  };
});

vi.mock('@editor/utils/editor', () => ({
  isIncludeDataSource: vi.fn(() => false),
}));

vi.mock('@editor/utils/logger', () => ({
  error: vi.fn(),
}));

const Wrap = (props: any, services: any) =>
  defineComponent({
    setup() {
      initServiceState(props, services);
      return () => h('div');
    },
  });

const WrapEvents = (props: any, emit: any, services: any) =>
  defineComponent({
    setup() {
      initServiceEvents(props, emit, services);
      return () => h('div');
    },
  });

describe('initServiceState', () => {
  let services: ReturnType<typeof mkServices>;

  beforeEach(() => {
    services = mkServices();
  });

  test('modelValue 变化设置 editor root', () => {
    const props = { modelValue: { id: 'a' } } as any;
    mount(Wrap(props, services));
    expect(services.editorService.set).toHaveBeenCalledWith('root', { id: 'a' }, { historySource: 'initial' });
  });

  test('disabledMultiSelect/alwaysMultiSelect 设置', () => {
    const props = { disabledMultiSelect: true, alwaysMultiSelect: true } as any;
    mount(Wrap(props, services));
    expect(services.editorService.set).toHaveBeenCalledWith('disabledMultiSelect', true);
    expect(services.editorService.set).toHaveBeenCalledWith('alwaysMultiSelect', true);
  });

  test('componentGroupList 调用 setList', () => {
    const props = { componentGroupList: [{ items: [] }] } as any;
    mount(Wrap(props, services));
    expect(services.componentListService.setList).toHaveBeenCalledWith([{ items: [] }]);
  });

  test('propsConfigs/propsValues 设置', () => {
    const props = { propsConfigs: { a: [] }, propsValues: { a: {} } } as any;
    mount(Wrap(props, services));
    expect(services.propsService.setPropsConfigs).toHaveBeenCalled();
    expect(services.propsService.setPropsValues).toHaveBeenCalled();
  });

  test('eventMethodList 设置 events/methods', () => {
    const props = {
      eventMethodList: { typeA: { events: [{ name: 'click' }], methods: [{ name: 'm' }] } },
    } as any;
    mount(Wrap(props, services));
    expect(services.eventsService.setEvents).toHaveBeenCalledWith({ typeA: [{ name: 'click' }] });
    expect(services.eventsService.setMethods).toHaveBeenCalledWith({ typeA: [{ name: 'm' }] });
  });

  test('datasourceConfigs 设置 form config', () => {
    const props = { datasourceConfigs: { http: [{ name: 'url' }] } } as any;
    mount(Wrap(props, services));
    expect(services.dataSourceService.setFormConfig).toHaveBeenCalledWith('http', [{ name: 'url' }]);
  });

  test('datasourceValues 设置 form value', () => {
    const props = { datasourceValues: { base: { id: 'x' } } } as any;
    mount(Wrap(props, services));
    expect(services.dataSourceService.setFormValue).toHaveBeenCalledWith('base', { id: 'x' });
  });

  test('datasourceEventMethodList 设置 form event/method', () => {
    const props = {
      datasourceEventMethodList: {
        http: { events: [{ name: 'load' }], methods: [{ name: 'do' }] },
      },
    } as any;
    mount(Wrap(props, services));
    expect(services.dataSourceService.setFormEvent).toHaveBeenCalledWith('http', [{ name: 'load' }]);
    expect(services.dataSourceService.setFormMethod).toHaveBeenCalledWith('http', [{ name: 'do' }]);
  });

  test('defaultSelected 调用 select', () => {
    services.editorService.getNodeById.mockReturnValue({ id: 'n1' });
    const props = { defaultSelected: 'n1' } as any;
    mount(Wrap(props, services));
    expect(services.editorService.select).toHaveBeenCalledWith('n1');
  });

  test('defaultSelected 对应节点不存在时不调用 select', () => {
    services.editorService.getNodeById.mockReturnValue(null);
    const props = { defaultSelected: 'n1' } as any;
    mount(Wrap(props, services));
    expect(services.editorService.select).not.toHaveBeenCalled();
  });

  test('defaultSelected select 失败时兜底成日志，不产生未处理的拒绝', async () => {
    const err = new Error('获取不到组件信息');
    vi.mocked(logger.error).mockClear();
    services.editorService.getNodeById.mockReturnValue({ id: 'n1' });
    services.editorService.select.mockRejectedValue(err);
    const props = { defaultSelected: 'n1' } as any;
    mount(Wrap(props, services));
    await nextTick();
    expect(logger.error).toHaveBeenCalledWith(err);
  });

  test('stageRect 设置 ui state', () => {
    const props = { stageRect: { width: 100 } } as any;
    mount(Wrap(props, services));
    expect(services.uiService.set).toHaveBeenCalledWith('stageRect', { width: 100 });
  });

  test('disabledCodeBlock/disabledDataSource', () => {
    const props = { disabledCodeBlock: true, disabledDataSource: true } as any;
    mount(Wrap(props, services));
    expect(services.propsService.setDisabledCodeBlock).toHaveBeenCalledWith(true);
    expect(services.propsService.setDisabledDataSource).toHaveBeenCalledWith(true);
  });

  test('卸载时重置所有 service', () => {
    const wrapper = mount(Wrap({} as any, services));
    wrapper.unmount();
    expect(services.editorService.resetState).toHaveBeenCalled();
    expect(services.historyService.resetState).toHaveBeenCalled();
    expect(services.propsService.resetState).toHaveBeenCalled();
    expect(services.uiService.resetState).toHaveBeenCalled();
    expect(services.componentListService.resetState).toHaveBeenCalled();
    expect(services.codeBlockService.resetState).toHaveBeenCalled();
    expect(services.eventsService.resetState).toHaveBeenCalled();
    expect(services.keybindingService.reset).toHaveBeenCalled();
    expect(services.depService.reset).toHaveBeenCalled();
  });
});

const mkDataSourceManager = () => ({
  addDataSource: vi.fn(),
  removeDataSource: vi.fn(),
  get: vi.fn(() => ({
    setFields: vi.fn(),
    setData: vi.fn(),
    getDefaultData: vi.fn(() => ({})),
  })),
  init: vi.fn(),
  compiledNode: vi.fn((node: any) => node),
});

/** renderer.runtime 直接就绪，getTMagicApp 走同步分支 */
const mkReadyStage = (app: any) => {
  const runtime = {
    getApp: vi.fn(() => app),
    updateRootConfig: vi.fn(),
    updatePageId: vi.fn(),
  };
  return {
    renderer: {
      runtime,
      getRuntime: vi.fn(async () => runtime),
      once: vi.fn(),
    },
    select: vi.fn(),
    reloadIframe: vi.fn(),
    update: vi.fn(),
    runtime,
  };
};

describe('initServiceEvents', () => {
  let services: ReturnType<typeof mkServices>;
  let emit: any;

  beforeEach(() => {
    services = mkServices();
    emit = vi.fn();
  });

  test('注册 editorService 事件', () => {
    mount(WrapEvents({} as any, emit, services));
    const events = services.editorService.on.mock.calls.map((c: any[]) => c[0]);
    expect(events).toContain('root-change');
    expect(events).toContain('add');
    expect(events).toContain('remove');
    expect(events).toContain('update');
    expect(events).toContain('history-change');
  });

  test('注册 dataSourceService/codeBlockService/depService 事件', () => {
    mount(WrapEvents({} as any, emit, services));
    expect(services.dataSourceService.on.mock.calls.map((c: any[]) => c[0])).toEqual(
      expect.arrayContaining(['add', 'update', 'remove']),
    );
    expect(services.codeBlockService.on.mock.calls.map((c: any[]) => c[0])).toEqual(
      expect.arrayContaining(['addOrUpdate', 'remove']),
    );
    expect(services.depService.on.mock.calls.map((c: any[]) => c[0])).toEqual(
      expect.arrayContaining(['add-target', 'remove-target', 'ds-collected']),
    );
  });

  test('rootChange 处理代码块和数据源', async () => {
    services.editorService.state.root = { id: 'r' };
    mount(WrapEvents({} as any, emit, services));
    const value: any = {
      id: 'r',
      codeBlocks: { c1: { name: 'a', content: '' } },
      dataSources: [{ id: 'd1', type: 'base' }],
      items: [],
    };
    services.editorService.emit('root-change', value, null);
    await new Promise((r) => setTimeout(r, 0));
    expect(services.codeBlockService.setCodeDsl).toHaveBeenCalled();
    expect(services.dataSourceService.set).toHaveBeenCalledWith('dataSources', value.dataSources);
    expect(services.depService.clearTargets).toHaveBeenCalled();
    expect(services.depService.addTarget).toHaveBeenCalled();
  });

  test('rootChange null 时直接返回', () => {
    mount(WrapEvents({} as any, emit, services));
    services.editorService.emit('root-change', null);
    expect(services.codeBlockService.setCodeDsl).not.toHaveBeenCalled();
  });

  test('add 事件触发 collectIdle', async () => {
    mount(WrapEvents({} as any, emit, services));
    services.editorService.emit('add', [{ id: 'n', type: 'text' }]);
    await new Promise((r) => setTimeout(r, 0));
    expect(services.depService.collectIdle).toHaveBeenCalled();
  });

  test('remove 事件触发 depService.clear', () => {
    mount(WrapEvents({} as any, emit, services));
    services.editorService.emit('remove', [{ id: 'n' }]);
    expect(services.depService.clear).toHaveBeenCalled();
  });

  test('update 事件 changeRecords 中包含数据源', async () => {
    mount(WrapEvents({} as any, emit, services));
    services.editorService.emit('update', [
      {
        newNode: { id: 'n1', type: 'text' },
        oldNode: { id: 'n1', type: 'text' },
        changeRecords: [{ propPath: 'props.value', value: '${ds.field}' }],
      },
    ]);
    await new Promise((r) => setTimeout(r, 0));
    expect(services.depService.collectIdle).toHaveBeenCalled();
  });

  test('update 事件 changeRecords 为空走 normal', async () => {
    services.editorService.state.root = { id: 'r', items: [] };
    mount(WrapEvents({} as any, emit, services));
    services.editorService.emit('update', [
      { newNode: { id: 'n1', type: 'text' }, oldNode: { id: 'n1', type: 'text' } },
    ]);
    await new Promise((r) => setTimeout(r, 0));
    expect(services.depService.collectIdle).toHaveBeenCalled();
  });

  test('history-change 触发 collect', async () => {
    services.editorService.state.root = { id: 'r' };
    mount(WrapEvents({} as any, emit, services));
    services.editorService.emit('history-change', { id: 'p1', type: 'page' });
    await new Promise((r) => setTimeout(r, 0));
    expect(services.depService.collectIdle).toHaveBeenCalled();
  });

  test('dataSourceService add 触发 initDataSourceDepTarget', () => {
    mount(WrapEvents({} as any, emit, services));
    services.dataSourceService.emit('add', { id: 'd1', type: 'base' });
    expect(services.depService.addTarget).toHaveBeenCalled();
  });

  test('dataSourceService remove root 不存在时不报错', async () => {
    services.editorService.state.root = null;
    mount(WrapEvents({} as any, emit, services));
    services.dataSourceService.emit('remove', 'd1');
    await new Promise((r) => setTimeout(r, 0));
    expect(services.depService.removeTarget).not.toHaveBeenCalled();
  });

  test('dataSourceService update 修改 fields', async () => {
    services.editorService.state.root = { id: 'r', items: [{ id: 'a', type: 'text' }] };
    mount(WrapEvents({} as any, emit, services));
    services.dataSourceService.emit(
      'update',
      { id: 'd1', type: 'base', fields: [], mocks: [], methods: [] },
      { changeRecords: [{ propPath: 'fields' }] },
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(services.depService.removeTarget).toHaveBeenCalled();
    expect(services.depService.addTarget).toHaveBeenCalled();
  });

  test('codeBlockService addOrUpdate 新增/更新', () => {
    services.depService.hasTarget.mockReturnValueOnce(false).mockReturnValueOnce(true);
    services.depService.getTarget.mockReturnValue({ name: 'old' });
    mount(WrapEvents({} as any, emit, services));
    services.codeBlockService.emit('addOrUpdate', 'c1', { name: 'a' });
    expect(services.depService.addTarget).toHaveBeenCalled();
    services.codeBlockService.emit('addOrUpdate', 'c1', { name: 'b' });
    expect(services.depService.getTarget).toHaveBeenCalled();
  });

  test('codeBlockService remove', () => {
    mount(WrapEvents({} as any, emit, services));
    services.codeBlockService.emit('remove', 'c1');
    expect(services.depService.removeTarget).toHaveBeenCalledWith('c1', DepTargetType.CODE_BLOCK);
  });

  test('depService add-target 设置 root.dataSourceDeps/CondDeps/MethodDeps', () => {
    services.editorService.state.root = { id: 'r' };
    mount(WrapEvents({} as any, emit, services));
    services.depService.emit('add-target', { id: 't1', type: DepTargetType.DATA_SOURCE, deps: {} });
    services.depService.emit('add-target', { id: 't2', type: DepTargetType.DATA_SOURCE_COND, deps: {} });
    services.depService.emit('add-target', { id: 't3', type: DepTargetType.DATA_SOURCE_METHOD, deps: {} });
    expect(services.editorService.state.root.dataSourceDeps).toHaveProperty('t1');
    expect(services.editorService.state.root.dataSourceCondDeps).toHaveProperty('t2');
    expect(services.editorService.state.root.dataSourceMethodDeps).toHaveProperty('t3');
  });

  test('depService remove-target 清理 root deps', () => {
    services.editorService.state.root = {
      id: 'r',
      dataSourceDeps: { a: {} },
      dataSourceCondDeps: { b: {} },
      dataSourceMethodDeps: { c: {} },
    };
    mount(WrapEvents({} as any, emit, services));
    services.depService.emit('remove-target', 'a', DepTargetType.DATA_SOURCE);
    services.depService.emit('remove-target', 'b', DepTargetType.DATA_SOURCE_COND);
    services.depService.emit('remove-target', 'c', DepTargetType.DATA_SOURCE_METHOD);
    expect(services.editorService.state.root.dataSourceDeps).not.toHaveProperty('a');
    expect(services.editorService.state.root.dataSourceCondDeps).not.toHaveProperty('b');
    expect(services.editorService.state.root.dataSourceMethodDeps).not.toHaveProperty('c');
  });

  test('卸载时取消所有事件订阅', () => {
    const wrapper = mount(WrapEvents({} as any, emit, services));
    wrapper.unmount();
    expect(services.editorService.off).toHaveBeenCalled();
    expect(services.codeBlockService.off).toHaveBeenCalled();
    expect(services.dataSourceService.off).toHaveBeenCalled();
    expect(services.depService.off).toHaveBeenCalled();
  });

  test('runtimeUrl 变化时重新加载 iframe', async () => {
    const stage = {
      reloadIframe: vi.fn(),
      renderer: {
        once: vi.fn((event: string, cb: any) => {
          cb({
            updateRootConfig: vi.fn(),
            updatePageId: vi.fn(),
          });
        }),
      },
      select: vi.fn(),
    };
    services.editorService.state.stage = stage;
    services.editorService.state.page = { id: 'p1' };
    services.editorService.state.node = { id: 'n1' };

    const hostComp = defineComponent({
      props: { runtimeUrl: { type: String, default: '' } },
      setup(props) {
        initServiceEvents(props as any, emit, services as any);
        return () => h('div');
      },
    });

    const wrapper = mount(hostComp);
    await wrapper.setProps({ runtimeUrl: 'http://x' });
    await new Promise((r) => setTimeout(r, 10));
    expect(stage.reloadIframe).toHaveBeenCalledWith('http://x');
  });

  // 因 services 中 editor.state 不是 reactive，stage watch 不会触发，跳过该测试场景

  test('getTMagicApp 在 runtime 未就绪时等待 runtime-ready，并复用同一个 promise', async () => {
    const dataSourceManager = mkDataSourceManager();
    const app = { dsl: {}, dataSourceManager };
    let runtimeReady: any;
    const renderer: any = {
      runtime: null,
      getRuntime: vi.fn(),
      once: vi.fn((_event: string, cb: any) => {
        runtimeReady = cb;
      }),
    };
    services.editorService.state.stage = { renderer, select: vi.fn() };
    mount(WrapEvents({} as any, emit, services));

    services.dataSourceService.emit('add', { id: 'd1', type: 'base' });
    services.dataSourceService.emit('add', { id: 'd2', type: 'base' });
    await nextTick();
    // 两次调用只应注册一次 runtime-ready 监听
    expect(renderer.once).toHaveBeenCalledTimes(1);

    renderer.runtime = { getApp: () => app };
    runtimeReady();
    await new Promise((r) => setTimeout(r, 0));

    expect(dataSourceManager.addDataSource).toHaveBeenCalledTimes(2);
    expect(dataSourceManager.init).toHaveBeenCalled();
  });

  test('getTMagicApp 在 stage 没有 renderer 时返回 undefined', async () => {
    services.editorService.state.stage = { select: vi.fn() };
    mount(WrapEvents({} as any, emit, services));

    services.dataSourceService.emit('add', { id: 'd1', type: 'base' });
    await new Promise((r) => setTimeout(r, 0));

    expect(services.depService.addTarget).toHaveBeenCalled();
  });

  test('ds-collected 事件把 dataSourceDeps 同步给 runtime app', async () => {
    const app: any = { dsl: { dataSourceDeps: null }, dataSourceManager: mkDataSourceManager() };
    services.editorService.state.stage = mkReadyStage(app);
    services.editorService.state.root = { id: 'r', dataSourceDeps: { d1: {} } };
    mount(WrapEvents({} as any, emit, services));

    services.depService.emit('ds-collected');
    await new Promise((r) => setTimeout(r, 0));

    expect(app.dsl.dataSourceDeps).toEqual({ d1: {} });
  });

  test('rootChange items 是数组时更新画布 dsl', async () => {
    const app: any = { dsl: {}, dataSourceManager: mkDataSourceManager() };
    const stage = mkReadyStage(app);
    services.editorService.state.stage = stage;
    services.editorService.state.page = { id: 'p1' };
    services.editorService.state.node = { id: 'n1' };
    mount(WrapEvents({} as any, emit, services));

    services.editorService.emit('root-change', {
      id: 'r',
      items: [{ id: 'n1', type: 'text' }],
      dataSources: [],
      dataSourceDeps: { d1: {} },
      codeBlocks: {},
    });
    await new Promise((r) => setTimeout(r, 10));

    expect(stage.runtime.updatePageId).toHaveBeenCalledWith('p1');
    expect(stage.runtime.updateRootConfig).toHaveBeenCalled();
    expect(stage.select).toHaveBeenCalledWith('n1');
  });

  test('rootChange items 不是数组时清空依赖', async () => {
    services.editorService.state.root = { id: 'r' };
    mount(WrapEvents({} as any, emit, services));

    const value: any = { id: 'r', dataSourceDeps: { a: {} }, dataSourceCondDeps: { b: {} } };
    services.editorService.emit('root-change', value);
    await new Promise((r) => setTimeout(r, 0));

    expect(services.depService.clear).toHaveBeenCalled();
    expect(value.dataSourceDeps).toBeUndefined();
    expect(value.dataSourceCondDeps).toBeUndefined();
  });

  test('rootChange 没有可选中节点时回落到 root 自身', async () => {
    services.editorService.getNodeById.mockReturnValue(null);
    mount(WrapEvents({} as any, emit, services));

    const value: any = { id: 'r', items: [] };
    services.editorService.emit('root-change', value, { id: 'prev' });
    await new Promise((r) => setTimeout(r, 0));

    expect(services.editorService.set).toHaveBeenCalledWith('nodes', [value]);
    expect(services.editorService.set).toHaveBeenCalledWith('parent', null);
    expect(services.editorService.set).toHaveBeenCalledWith('page', null);
    expect(emit).toHaveBeenCalledWith('update:modelValue', value);
  });

  test('rootChange 有 items 时选中第一个节点', async () => {
    services.editorService.getNodeById.mockReturnValue(null);
    mount(WrapEvents({} as any, emit, services));

    services.editorService.emit('root-change', { id: 'r', items: [{ id: 'first', type: 'page' }] });
    await new Promise((r) => setTimeout(r, 0));

    expect(services.editorService.select).toHaveBeenCalledWith({ id: 'first', type: 'page' });
  });

  test('update 事件：ROOT 节点、无 propPath、命中已收集依赖三种分支', async () => {
    services.editorService.state.root = { id: 'r', items: [] };
    services.depService.getTargets.mockReturnValue({
      t1: { deps: { n3: { keys: ['props.text'] } } },
    });
    mount(WrapEvents({} as any, emit, services));

    services.editorService.emit('update', [
      { newNode: { id: 'r', type: 'root' }, oldNode: { id: 'r', type: 'root' } },
      {
        newNode: { id: 'n2', type: 'text' },
        oldNode: { id: 'n2', type: 'text' },
        changeRecords: [{ value: 'x' }],
      },
      {
        newNode: { id: 'n3', type: 'text' },
        oldNode: { id: 'n3', type: 'text' },
        changeRecords: [{ propPath: 'props.text', value: 'x' }],
      },
    ]);
    await new Promise((r) => setTimeout(r, 0));

    expect(services.depService.collectIdle).toHaveBeenCalled();
  });

  test('dataSource update 修改 mocks / methods 分别只重建对应 target', async () => {
    const app: any = { dsl: {}, dataSourceManager: mkDataSourceManager() };
    services.editorService.state.stage = mkReadyStage(app);
    services.editorService.state.root = { id: 'r', items: [{ id: 'a', type: 'text' }] };
    mount(WrapEvents({} as any, emit, services));

    services.dataSourceService.emit(
      'update',
      { id: 'd1', type: 'base', fields: [], mocks: [{ useInEditor: true, data: { a: 1 } }] },
      { changeRecords: [{ propPath: 'mocks' }] },
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(services.depService.removeTarget).toHaveBeenCalledWith('d1', DepTargetType.DATA_SOURCE);

    services.depService.removeTarget.mockClear();
    services.dataSourceService.emit(
      'update',
      { id: 'd1', type: 'base', fields: [], methods: [] },
      { changeRecords: [{ propPath: 'methods.0.name' }] },
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(services.depService.removeTarget).toHaveBeenCalledWith('d1', DepTargetType.DATA_SOURCE_METHOD);
  });

  test('dataSource update 无依赖变更时只刷新数据', async () => {
    const dataSourceManager = mkDataSourceManager();
    const app: any = { dsl: {}, dataSourceManager };
    services.editorService.state.stage = mkReadyStage(app);
    services.editorService.state.root = { id: 'r', items: [], dataSources: [{ id: 'd1' }] };
    mount(WrapEvents({} as any, emit, services));

    services.dataSourceService.emit(
      'update',
      { id: 'd1', type: 'base', fields: [] },
      { changeRecords: [{ propPath: 'title' }, {}] },
    );
    await new Promise((r) => setTimeout(r, 0));

    expect(dataSourceManager.get).toHaveBeenCalledWith('d1');
    expect(services.depService.clearIdleTasks).not.toHaveBeenCalled();
  });

  test('dataSource remove 重新收集依赖并从 app 中移除数据源', async () => {
    const dataSourceManager = mkDataSourceManager();
    const app: any = { dsl: {}, dataSourceManager };
    services.editorService.state.stage = mkReadyStage(app);
    services.editorService.state.root = {
      id: 'r',
      items: [],
      dataSources: [{ id: 'd1' }],
      dataSourceDeps: { d1: { n1: {} } },
    };
    mount(WrapEvents({} as any, emit, services));

    services.dataSourceService.emit('remove', 'd1');
    await new Promise((r) => setTimeout(r, 0));

    expect(dataSourceManager.removeDataSource).toHaveBeenCalledWith('d1');
    expect(services.depService.removeTarget).toHaveBeenCalledWith('d1', DepTargetType.DATA_SOURCE);
    expect(services.depService.removeTarget).toHaveBeenCalledWith('d1', DepTargetType.DATA_SOURCE_COND);
    expect(services.depService.removeTarget).toHaveBeenCalledWith('d1', DepTargetType.DATA_SOURCE_METHOD);
    expect(app.dsl.dataSources).toEqual([{ id: 'd1' }]);
  });

  test('dataSource remove 收集未完成时不移除数据源', async () => {
    const dataSourceManager = mkDataSourceManager();
    const app: any = { dsl: {}, dataSourceManager };
    services.editorService.state.stage = mkReadyStage(app);
    services.editorService.state.root = { id: 'r', items: [] };
    vi.mocked(getNodes).mockReturnValueOnce([{ id: 'n1', type: 'text' }] as any);
    services.depService.collectIdle.mockResolvedValue(false);
    mount(WrapEvents({} as any, emit, services));

    services.dataSourceService.emit('remove', 'd1');
    await new Promise((r) => setTimeout(r, 0));

    expect(dataSourceManager.removeDataSource).not.toHaveBeenCalled();
  });
});
