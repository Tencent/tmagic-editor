/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import EventSelect from '@editor/fields/EventSelect.vue';

const { editorService, dataSourceService, eventsService, codeBlockService, propsService } = vi.hoisted(() => ({
  editorService: {
    get: vi.fn(),
    getNodeById: vi.fn(),
  },
  dataSourceService: {
    get: vi.fn(),
    getDataSourceById: vi.fn(),
    getFormEvent: vi.fn(() => []),
  },
  eventsService: {
    getEvent: vi.fn(() => [{ label: 'click', value: 'click' }]),
    getMethod: vi.fn(() => [{ label: 'open', value: 'open' }]),
  },
  codeBlockService: {
    getCodeDsl: vi.fn(() => ({ c1: {} })),
    getEditStatus: vi.fn(() => true),
  },
  propsService: {
    getDisabledCodeBlock: vi.fn(() => false),
    getDisabledDataSource: vi.fn(() => false),
  },
}));

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService, dataSourceService, eventsService, codeBlockService, propsService }),
}));

vi.mock('@editor/services/editor', () => ({ default: editorService }));
vi.mock('@editor/services/dataSource', () => ({ default: dataSourceService }));
vi.mock('@editor/services/events', () => ({ default: eventsService }));
vi.mock('@editor/services/codeBlock', () => ({ default: codeBlockService }));
vi.mock('@editor/services/props', () => ({ default: propsService }));

vi.mock('@editor/utils/data-source', async () => {
  const actual = await vi.importActual<any>('@editor/utils/data-source');
  return { ...actual, getCascaderOptionsFromFields: vi.fn(() => []) };
});

vi.mock('@tmagic/form', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    defineFormItem: (cfg: any) => cfg,
    MTable: defineComponent({
      name: 'MTable',
      props: ['model', 'config', 'name', 'size', 'disabled'],
      emits: ['change'],
      setup() {
        return () => h('div', { class: 'fake-table' });
      },
    }),
    MPanel: defineComponent({
      name: 'MPanel',
      props: ['model', 'config', 'prop', 'disabled', 'size', 'labelWidth', 'lastValues', 'isCompare'],
      emits: ['change'],
      setup(_p, { slots }) {
        return () => h('div', { class: 'fake-panel' }, slots.header?.());
      },
    }),
    MContainer: defineComponent({
      name: 'MFormContainer',
      props: ['model', 'config', 'prop', 'disabled', 'size'],
      emits: ['change'],
      setup() {
        return () => h('div', { class: 'fake-container' });
      },
    }),
  };
});

vi.mock('@tmagic/design', () => ({
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    props: ['type', 'size', 'disabled', 'icon', 'link'],
    emits: ['click'],
    setup(_p, { emit, slots }) {
      return () => h('button', { onClick: () => emit('click') }, slots.default?.());
    },
  }),
}));

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return {
    ...actual,
    DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX: 'ds_change_',
    traverseNode: (node: any, fn: any) => {
      fn(node);
      node.items?.forEach((c: any) => fn(c));
    },
  };
});

const baseProps = (extra: any = {}) => ({
  config: { type: 'event-select', src: 'component' },
  name: 'events',
  prop: 'events',
  model: { events: [] },
  size: 'default',
  disabled: false,
  ...extra,
});

describe('EventSelect', () => {
  test('events 为空 isOldVersion=false 显示新版按钮', () => {
    const wrapper = mount(EventSelect, { props: baseProps() as any });
    expect(wrapper.find('.create-button').exists()).toBe(true);
    expect(wrapper.find('.fake-table').exists()).toBe(false);
  });

  test('addEvent emit 事件并携带 modifyKey', async () => {
    const wrapper = mount(EventSelect, { props: baseProps() as any });
    await wrapper.find('.create-button').trigger('click');
    const evts = wrapper.emitted('change');
    expect((evts?.[0]?.[0] as any).name).toBe('');
  });

  test('removeEvent 删除指定 index', async () => {
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const buttons = wrapper.findAll('button');
    const lastBtn = buttons[buttons.length - 1];
    await lastBtn.trigger('click');
    const evts = wrapper.emitted('change');
    expect(evts).toBeTruthy();
  });

  test('events 含 actions 字段时不算 oldVersion，渲染 panel', () => {
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    expect(wrapper.findAll('.fake-panel').length).toBe(1);
  });

  test('events 不含 actions 字段时为 oldVersion，渲染 table', () => {
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a' }] },
      }) as any,
    });
    expect(wrapper.find('.fake-table').exists()).toBe(true);
  });

  test('Table change emit', async () => {
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a' }] },
      }) as any,
    });
    await wrapper.findComponent({ name: 'MTable' }).vm.$emit('change', null, { modifyKey: 'foo' });
    expect(wrapper.emitted('change')).toBeTruthy();
  });

  test('Panel header MFormContainer change emit', async () => {
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    await wrapper.findComponent({ name: 'MFormContainer' }).vm.$emit('change', null, { modifyKey: 'name' });
    expect(wrapper.emitted('change')).toBeTruthy();
  });

  test('addEvent 在 model[name] 为空时初始化', async () => {
    const m: any = { events: [] };
    const wrapper = mount(EventSelect, { props: baseProps({ model: m }) as any });
    await wrapper.find('.create-button').trigger('click');
    const evts = wrapper.emitted('change');
    expect(evts).toBeTruthy();
    expect((evts?.[0]?.[0] as any).actions).toEqual([]);
  });

  test('eventNameConfig type/options src=component 返回 select', () => {
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const cfg = wrapper.findComponent({ name: 'MFormContainer' }).props('config') as any;
    expect(cfg.type(undefined, { formValue: { type: 'btn' } })).toBe('select');
    const opts = cfg.options(undefined, { formValue: { type: 'btn' } });
    expect(Array.isArray(opts)).toBe(true);
    expect(opts[0]).toMatchObject({ text: 'click', value: 'click' });
  });

  test('eventNameConfig.rules 仅校验事件名是否在可选项中', () => {
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const cfg = wrapper.findComponent({ name: 'MFormContainer' }).props('config') as any;
    const [rule] = cfg.rules;

    const okCb = vi.fn();
    rule.validator({ value: 'click', callback: okCb }, { formValue: { type: 'btn' } });
    expect(okCb).toHaveBeenCalledWith();

    const errCb = vi.fn();
    rule.validator({ value: 'unknown', callback: errCb }, { formValue: { type: 'btn' } });
    expect(errCb).toHaveBeenCalledWith('事件名(unknown)不存在');

    // 空值不做枚举校验
    const emptyCb = vi.fn();
    rule.validator({ value: '', callback: emptyCb }, { formValue: { type: 'btn' } });
    expect(emptyCb).toHaveBeenCalledWith();
  });

  test('eventNameConfig.rules 自定义 options 时跳过枚举', () => {
    const wrapper = mount(EventSelect, {
      props: baseProps({
        config: { type: 'event-select', src: 'component', eventNameConfig: { options: () => [{ value: 'x' }] } },
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const cfg = wrapper.findComponent({ name: 'MFormContainer' }).props('config') as any;
    const [rule] = cfg.rules;

    const cb = vi.fn();
    rule.validator({ value: 'whatever', callback: cb }, { formValue: { type: 'btn' } });
    expect(cb).toHaveBeenCalledWith();
  });

  test('eventNameConfig type 当 page-fragment 且有 pageFragmentId 返回 cascader', () => {
    editorService.get.mockReturnValue({ items: [{ id: 'pf1', items: [] }] });
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const cfg = wrapper.findComponent({ name: 'MFormContainer' }).props('config') as any;
    expect(cfg.type(undefined, { formValue: { type: 'page-fragment-container', pageFragmentId: 'pf1' } })).toBe(
      'cascader',
    );
    const opts = cfg.options(undefined, { formValue: { type: 'page-fragment-container', pageFragmentId: 'pf1' } });
    expect(Array.isArray(opts)).toBe(true);
  });

  test('eventNameConfig src=datasource 返回事件 + 数据变化字段', () => {
    dataSourceService.getDataSourceById.mockReturnValue({ fields: [{ name: 'f1' }] });
    const wrapper = mount(EventSelect, {
      props: baseProps({
        config: { type: 'event-select', src: 'datasource' },
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const cfg = wrapper.findComponent({ name: 'MFormContainer' }).props('config') as any;
    const opts = cfg.options(undefined, { formValue: { type: 'ds', id: 'd1' } });
    expect(opts).toEqual([{ label: '数据变化', value: 'ds_change_', children: [] }]);
  });

  test('eventNameConfig src=datasource 无 fields 时返回原始事件', () => {
    dataSourceService.getDataSourceById.mockReturnValue({ fields: [] });
    const wrapper = mount(EventSelect, {
      props: baseProps({
        config: { type: 'event-select', src: 'datasource' },
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const cfg = wrapper.findComponent({ name: 'MFormContainer' }).props('config') as any;
    const opts = cfg.options(undefined, { formValue: { type: 'ds', id: 'd1' } });
    expect(opts).toEqual([]);
  });

  test('actionTypeConfig 含 组件/代码/数据源', () => {
    propsService.getDisabledCodeBlock.mockReturnValue(false);
    propsService.getDisabledDataSource.mockReturnValue(false);
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const panelCfg = wrapper.findComponent({ name: 'MPanel' }).props('config') as any;
    const groupItems = panelCfg.items[0].items;
    const actionType = groupItems[0];
    const opts = typeof actionType.options === 'function' ? actionType.options() : actionType.options;
    expect(opts.map((o: any) => o.value).sort()).toEqual(['code', 'comp', 'data-source'].sort());
  });

  test('actionTypeConfig disabledCodeBlock/disabledDataSource 时不包含选项', () => {
    propsService.getDisabledCodeBlock.mockReturnValue(true);
    propsService.getDisabledDataSource.mockReturnValue(true);
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const panelCfg = wrapper.findComponent({ name: 'MPanel' }).props('config') as any;
    const actionType = panelCfg.items[0].items[0];
    const opts = typeof actionType.options === 'function' ? actionType.options() : actionType.options;
    expect(opts.map((o: any) => o.value)).toEqual(['comp']);
    propsService.getDisabledCodeBlock.mockReturnValue(false);
    propsService.getDisabledDataSource.mockReturnValue(false);
  });

  test('targetCompConfig display/onChange', () => {
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const panelCfg = wrapper.findComponent({ name: 'MPanel' }).props('config') as any;
    const target = panelCfg.items[0].items[1];
    expect(target.display(undefined, { model: { actionType: 'comp' } })).toBe(true);
    const setModel = vi.fn();
    target.onChange(undefined, undefined, { setModel });
    expect(setModel).toHaveBeenCalledWith('method', '');
  });

  test('compActionConfig 解析 type/options', () => {
    editorService.getNodeById.mockReturnValue({ type: 'btn', id: '1' });
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const panelCfg = wrapper.findComponent({ name: 'MPanel' }).props('config') as any;
    const compAction = panelCfg.items[0].items[2];
    expect(compAction.type(undefined, { model: { to: '1' } })).toBe('select');
    expect(Array.isArray(compAction.options(undefined, { model: { to: '1' } }))).toBe(true);
  });

  test('compActionConfig type cascader 当 page-fragment-container', () => {
    editorService.getNodeById.mockReturnValue({ type: 'page-fragment-container', id: '1', pageFragmentId: 'pf1' });
    editorService.get.mockReturnValue({ items: [{ id: 'pf1', items: [{ id: 'c1', type: 'btn', name: 'b' }] }] });
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const panelCfg = wrapper.findComponent({ name: 'MPanel' }).props('config') as any;
    const compAction = panelCfg.items[0].items[2];
    expect(compAction.type(undefined, { model: { to: '1' } })).toBe('cascader');
    const opts = compAction.options(undefined, { model: { to: '1' } });
    expect(Array.isArray(opts)).toBe(true);
  });

  test('compActionConfig options 当 node 无 type 返回空数组', () => {
    editorService.getNodeById.mockReturnValue(null);
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const panelCfg = wrapper.findComponent({ name: 'MPanel' }).props('config') as any;
    const compAction = panelCfg.items[0].items[2];
    expect(compAction.options(undefined, { model: { to: 'unknown' } })).toEqual([]);
  });

  test('compActionConfig.rules 仅校验动作名是否在可选项中', () => {
    editorService.getNodeById.mockReturnValue({ type: 'btn', id: '1' });
    eventsService.getMethod.mockReturnValue([{ label: 'open', value: 'open' }]);
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const panelCfg = wrapper.findComponent({ name: 'MPanel' }).props('config') as any;
    const compAction = panelCfg.items[0].items[2];
    const [rule] = compAction.rules;

    const okCb = vi.fn();
    rule.validator({ value: 'open', callback: okCb }, { model: { to: '1' } });
    expect(okCb).toHaveBeenCalledWith();

    const errCb = vi.fn();
    rule.validator({ value: 'unknown', callback: errCb }, { model: { to: '1' } });
    expect(errCb).toHaveBeenCalledWith('动作名(unknown)不存在');

    const emptyCb = vi.fn();
    rule.validator({ value: '', callback: emptyCb }, { model: { to: '1' } });
    expect(emptyCb).toHaveBeenCalledWith();
  });

  test('compActionConfig.rules 自定义 options 时跳过枚举', () => {
    editorService.getNodeById.mockReturnValue({ type: 'btn', id: '1' });
    const wrapper = mount(EventSelect, {
      props: baseProps({
        config: {
          type: 'event-select',
          src: 'component',
          compActionConfig: { options: () => [{ text: 'x', value: 'x' }] },
        },
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const panelCfg = wrapper.findComponent({ name: 'MPanel' }).props('config') as any;
    const compAction = panelCfg.items[0].items[2];
    const [rule] = compAction.rules;

    const cb = vi.fn();
    rule.validator({ value: 'whatever', callback: cb }, { model: { to: '1' } });
    expect(cb).toHaveBeenCalledWith();
  });

  test('compActionConfig.rules 页面片 cascader 支持数组 method', () => {
    editorService.getNodeById.mockReturnValue({ type: 'page-fragment-container', id: '1', pageFragmentId: 'pf1' });
    editorService.get.mockReturnValue({ items: [{ id: 'pf1', items: [{ id: 'c1', type: 'btn', name: 'b' }] }] });
    eventsService.getMethod.mockReturnValue([{ label: 'open', value: 'open' }]);
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const panelCfg = wrapper.findComponent({ name: 'MPanel' }).props('config') as any;
    const compAction = panelCfg.items[0].items[2];
    const [rule] = compAction.rules;

    const okCb = vi.fn();
    rule.validator({ value: ['c1', 'open'], callback: okCb }, { model: { to: '1' } });
    expect(okCb).toHaveBeenCalledWith();

    const errCb = vi.fn();
    rule.validator({ value: ['c1', 'missing'], callback: errCb }, { model: { to: '1' } });
    expect(errCb).toHaveBeenCalledWith('动作名(c1.missing)不存在');
  });

  test('codeActionConfig display/notEditable', () => {
    codeBlockService.getEditStatus.mockReturnValue(false);
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const panelCfg = wrapper.findComponent({ name: 'MPanel' }).props('config') as any;
    const codeAction = panelCfg.items[0].items[3];
    expect(codeAction.display(undefined, { model: { actionType: 'code' } })).toBe(true);
    expect(codeAction.notEditable()).toBe(true);
    codeBlockService.getEditStatus.mockReturnValue(true);
  });

  test('dataSourceActionConfig display/notEditable', () => {
    dataSourceService.get.mockReturnValue(false);
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a', actions: [] }] },
      }) as any,
    });
    const panelCfg = wrapper.findComponent({ name: 'MPanel' }).props('config') as any;
    const dsAction = panelCfg.items[0].items[4];
    expect(dsAction.display(undefined, { model: { actionType: 'data-source' } })).toBe(true);
    expect(dsAction.notEditable()).toBe(true);
  });

  test('table 配置中 method options', () => {
    editorService.getNodeById.mockReturnValue({ type: 'btn' });
    const wrapper = mount(EventSelect, {
      props: baseProps({
        model: { events: [{ name: 'a' }] },
      }) as any,
    });
    const tableCfg = wrapper.findComponent({ name: 'MTable' }).props('config') as any;
    const methodCol = tableCfg.items.find((it: any) => it.name === 'method');
    const opts = methodCol.options(undefined, { model: { to: '1' } });
    expect(opts).toEqual([{ text: 'open', value: 'open' }]);
    editorService.getNodeById.mockReturnValue(null);
    expect(methodCol.options(undefined, { model: { to: '1' } })).toEqual([]);
  });

  describe('对比模式', () => {
    test('isCompare 但无 lastValues 时不进入对比，仍显示添加按钮', () => {
      const wrapper = mount(EventSelect, {
        props: baseProps({ isCompare: true, model: { events: [] } }) as any,
      });
      expect(wrapper.find('.create-button').exists()).toBe(true);
    });

    test('对比模式隐藏「添加事件」与删除按钮', () => {
      const wrapper = mount(EventSelect, {
        props: baseProps({
          isCompare: true,
          model: { events: [{ name: 'a', actions: [] }] },
          lastValues: { events: [{ name: 'a', actions: [] }] },
        }) as any,
      });
      expect(wrapper.find('.create-button').exists()).toBe(false);
      // 对比模式 panel header 内不渲染删除按钮（仅 MFormContainer 占位）
      expect(wrapper.findAll('button').length).toBe(0);
    });

    test('对比模式按索引对齐当前值与历史值，取最大长度渲染', () => {
      const wrapper = mount(EventSelect, {
        props: baseProps({
          isCompare: true,
          model: { events: [{ name: 'a', actions: [] }] },
          lastValues: {
            events: [
              { name: 'a', actions: [] },
              { name: 'b', actions: [] },
            ],
          },
        }) as any,
      });
      // 当前 1 项 + 历史 2 项 → 取 max=2，渲染 2 个 panel（含被删除的事件）
      expect(wrapper.findAll('.fake-panel').length).toBe(2);
      const panels = wrapper.findAllComponents({ name: 'MPanel' });
      expect(panels[0].props('isCompare')).toBe(true);
      // 缺失一侧用空对象兜底
      expect(panels[1].props('model')).toEqual({});
      expect(panels[1].props('lastValues')).toEqual({ name: 'b', actions: [] });
    });
  });

  test('removeEvent 通过 panel header 删除按钮调用', async () => {
    const m: any = {
      events: [
        { name: 'a', actions: [] },
        { name: 'b', actions: [] },
      ],
    };
    const wrapper = mount(EventSelect, { props: baseProps({ model: m }) as any });
    const buttons = wrapper.findAll('button');
    const deleteBtn = buttons[buttons.length - 1];
    await deleteBtn.trigger('click');
    expect(m.events.length).toBe(1);
  });
});
