/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { DepTargetType } from '@tmagic/core';

import { initServiceEvents, initServiceState } from '@editor/initService';

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
    collectIdle: vi.fn(async () => undefined),
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
    isPage: vi.fn((n: any) => n?.type === 'page'),
    isValueIncludeDataSource: vi.fn((v: any) => /\$\{/.test(String(v))),
  };
});

vi.mock('@editor/utils/editor', () => ({
  isIncludeDataSource: vi.fn(() => false),
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
    expect(services.eventsService.setEvents).toHaveBeenCalled();
    expect(services.eventsService.setMethods).toHaveBeenCalled();
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
    const props = { defaultSelected: 'n1' } as any;
    mount(Wrap(props, services));
    expect(services.editorService.select).toHaveBeenCalledWith('n1');
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
    expect(services.keybindingService.reset).toHaveBeenCalled();
    expect(services.depService.reset).toHaveBeenCalled();
  });
});

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
});
