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

let capturedConfig: any = null;
let capturedEventNameConfig: any = null;

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
    MContainer: defineComponent({
      name: 'MFormContainer',
      props: ['config', 'model', 'lastValues', 'isCompare', 'disabled', 'size', 'prop'],
      emits: ['change'],
      setup(props) {
        capturedEventNameConfig = props.config;
        return () => h('div', { class: 'fake-form-container' });
      },
    }),
    MGroupList: defineComponent({
      name: 'MGroupList',
      props: ['config', 'name', 'disabled', 'model', 'lastValues', 'isCompare', 'prop', 'size'],
      emits: ['change'],
      setup(props, { emit, slots }) {
        capturedConfig = props.config;
        return () => {
          const events = props.model?.[props.name] || [];
          const first = events[0];
          return h(
            'div',
            { class: 'fake-group-list', onClick: () => emit('change', events) },
            first && slots.title
              ? [
                  slots.title({
                    model: first,
                    lastValues: props.lastValues?.[props.name]?.[0],
                    prop: `${props.prop}.0`,
                    index: 0,
                    title: '事件 1',
                  }),
                ]
              : [],
          );
        };
      },
    }),
  };
});

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return {
    ...actual,
    DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX: 'ds_change_',
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

const eventNameCfg = () => capturedEventNameConfig;
const actionsCfg = () => capturedConfig.items[0];
const mountEvent = (extra: any = {}) => mount(EventSelect, { props: baseProps(extra) as any });

describe('EventSelect', () => {
  test('events 为空 isOldVersion=false 渲染 group-list', () => {
    const wrapper = mount(EventSelect, { props: baseProps() as any });
    expect(wrapper.find('.event-select-container').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'MGroupList' }).exists()).toBe(true);
    expect(wrapper.find('.fake-table').exists()).toBe(false);
    expect(capturedConfig.type).toBe('group-list');
    expect(capturedConfig.scrollLastItemIntoView).toBe(true);
    expect(capturedConfig.addButtonConfig.sticky).toBe(true);
    expect(capturedConfig.addButtonConfig.text).toBe('添加事件');
    expect(capturedConfig.defaultAdd).toEqual({ name: '', actions: [] });
    expect(capturedConfig.movable).toBe(false);
    expect(capturedConfig.items[0].scrollLastItemIntoView).toBe(true);
    expect(capturedConfig.items[0].addButtonConfig.sticky).toBe(true);
    expect(capturedConfig.items[0].addButtonConfig.text).toBe('新增动作');
  });

  test('group-list change 向外 emit', async () => {
    const wrapper = mount(EventSelect, { props: baseProps() as any });
    await wrapper.findComponent({ name: 'MGroupList' }).vm.$emit('change', [], { modifyKey: 'foo' });
    expect(wrapper.emitted('change')?.[0]?.[0]).toEqual([]);
  });

  test('title 里改事件名仍抛出事件列表，而不是单条', async () => {
    const events = [{ name: 'click', actions: [] }];
    const wrapper = mountEvent({ model: { events } });
    await wrapper.findComponent({ name: 'MFormContainer' }).vm.$emit('change', { name: 'click' }, {});
    expect(wrapper.emitted('change')?.[0]?.[0]).toEqual(events);
  });

  test('events 含 actions 字段时不算 oldVersion，渲染 group-list', () => {
    const wrapper = mountEvent({
      model: { events: [{ name: 'a', actions: [] }] },
    });
    expect(wrapper.findComponent({ name: 'MGroupList' }).exists()).toBe(true);
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

  test('eventNameConfig type/options src=component 返回 select', () => {
    mountEvent({
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const cfg = eventNameCfg();
    expect(cfg.type(undefined, { formValue: { type: 'btn' } })).toBe('select');
    const opts = cfg.options(undefined, { formValue: { type: 'btn' } });
    expect(Array.isArray(opts)).toBe(true);
    expect(opts[0]).toMatchObject({ text: 'click', value: 'click' });
  });

  test('eventNameConfig.rules 仅校验事件名是否在可选项中', () => {
    mountEvent({
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const cfg = eventNameCfg();
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
    mountEvent({
      config: { type: 'event-select', src: 'component', eventNameConfig: { options: () => [{ value: 'x' }] } },
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const cfg = eventNameCfg();
    const [rule] = cfg.rules;

    const cb = vi.fn();
    rule.validator({ value: 'whatever', callback: cb }, { formValue: { type: 'btn' } });
    expect(cb).toHaveBeenCalledWith();
  });

  test('eventNameConfig type 当 page-fragment 且有 pageFragmentId 返回 cascader', () => {
    editorService.get.mockReturnValue({ items: [{ id: 'pf1', items: [] }] });
    mountEvent({
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const cfg = eventNameCfg();
    expect(cfg.type(undefined, { formValue: { type: 'page-fragment-container', pageFragmentId: 'pf1' } })).toBe(
      'cascader',
    );
    const opts = cfg.options(undefined, { formValue: { type: 'page-fragment-container', pageFragmentId: 'pf1' } });
    expect(Array.isArray(opts)).toBe(true);
  });

  test('eventNameConfig src=datasource 返回事件 + 数据变化字段', () => {
    dataSourceService.getDataSourceById.mockReturnValue({ fields: [{ name: 'f1' }] });
    mountEvent({
      config: { type: 'event-select', src: 'datasource' },
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const cfg = eventNameCfg();
    const opts = cfg.options(undefined, { formValue: { type: 'ds', id: 'd1' } });
    expect(opts).toEqual([{ label: '数据变化', value: 'ds_change_', children: [] }]);
  });

  test('eventNameConfig src=datasource 无 fields 时返回原始事件', () => {
    dataSourceService.getDataSourceById.mockReturnValue({ fields: [] });
    mountEvent({
      config: { type: 'event-select', src: 'datasource' },
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const cfg = eventNameCfg();
    const opts = cfg.options(undefined, { formValue: { type: 'ds', id: 'd1' } });
    expect(opts).toEqual([]);
  });

  test('actionTypeConfig 含 组件/代码/数据源', () => {
    propsService.getDisabledCodeBlock.mockReturnValue(false);
    propsService.getDisabledDataSource.mockReturnValue(false);
    mountEvent({
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const actionType = actionsCfg().items[0];
    const opts = typeof actionType.options === 'function' ? actionType.options() : actionType.options;
    expect(opts.map((o: any) => o.value).sort()).toEqual(['code', 'comp', 'data-source'].sort());
  });

  test('actionTypeConfig disabledCodeBlock/disabledDataSource 时不包含选项', () => {
    propsService.getDisabledCodeBlock.mockReturnValue(true);
    propsService.getDisabledDataSource.mockReturnValue(true);
    mountEvent({
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const actionType = actionsCfg().items[0];
    const opts = typeof actionType.options === 'function' ? actionType.options() : actionType.options;
    expect(opts.map((o: any) => o.value)).toEqual(['comp']);
    propsService.getDisabledCodeBlock.mockReturnValue(false);
    propsService.getDisabledDataSource.mockReturnValue(false);
  });

  test('targetCompConfig display/onChange', () => {
    mountEvent({
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const target = actionsCfg().items[1];
    expect(target.display(undefined, { model: { actionType: 'comp' } })).toBe(true);
    const setModel = vi.fn();
    target.onChange(undefined, undefined, { setModel });
    expect(setModel).toHaveBeenCalledWith('method', '');
  });

  test('compActionConfig 解析 type/options', () => {
    editorService.getNodeById.mockReturnValue({ type: 'btn', id: '1' });
    mountEvent({
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const compAction = actionsCfg().items[2];
    expect(compAction.type(undefined, { model: { to: '1' } })).toBe('select');
    expect(Array.isArray(compAction.options(undefined, { model: { to: '1' } }))).toBe(true);
  });

  test('compActionConfig type cascader 当 page-fragment-container', () => {
    editorService.getNodeById.mockReturnValue({ type: 'page-fragment-container', id: '1', pageFragmentId: 'pf1' });
    editorService.get.mockReturnValue({ items: [{ id: 'pf1', items: [{ id: 'c1', type: 'btn', name: 'b' }] }] });
    mountEvent({
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const compAction = actionsCfg().items[2];
    expect(compAction.type(undefined, { model: { to: '1' } })).toBe('cascader');
    const opts = compAction.options(undefined, { model: { to: '1' } });
    expect(Array.isArray(opts)).toBe(true);
  });

  test('compActionConfig options 当 node 无 type 返回空数组', () => {
    editorService.getNodeById.mockReturnValue(null);
    mountEvent({
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const compAction = actionsCfg().items[2];
    expect(compAction.options(undefined, { model: { to: 'unknown' } })).toEqual([]);
  });

  test('compActionConfig.rules 仅校验动作名是否在可选项中', () => {
    editorService.getNodeById.mockReturnValue({ type: 'btn', id: '1' });
    eventsService.getMethod.mockReturnValue([{ label: 'open', value: 'open' }]);
    mountEvent({
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const compAction = actionsCfg().items[2];
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
    mountEvent({
      config: {
        type: 'event-select',
        src: 'component',
        compActionConfig: { options: () => [{ text: 'x', value: 'x' }] },
      },
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const compAction = actionsCfg().items[2];
    const [rule] = compAction.rules;

    const cb = vi.fn();
    rule.validator({ value: 'whatever', callback: cb }, { model: { to: '1' } });
    expect(cb).toHaveBeenCalledWith();
  });

  test('compActionConfig.rules 页面片 cascader 支持数组 method', () => {
    editorService.getNodeById.mockReturnValue({ type: 'page-fragment-container', id: '1', pageFragmentId: 'pf1' });
    editorService.get.mockReturnValue({ items: [{ id: 'pf1', items: [{ id: 'c1', type: 'btn', name: 'b' }] }] });
    eventsService.getMethod.mockReturnValue([{ label: 'open', value: 'open' }]);
    mountEvent({
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const compAction = actionsCfg().items[2];
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
    mountEvent({
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const codeAction = actionsCfg().items[3];
    expect(codeAction.display(undefined, { model: { actionType: 'code' } })).toBe(true);
    expect(codeAction.notEditable()).toBe(true);
    codeBlockService.getEditStatus.mockReturnValue(true);
  });

  test('dataSourceActionConfig display/notEditable', () => {
    dataSourceService.get.mockReturnValue(false);
    mountEvent({
      model: { events: [{ name: 'a', actions: [] }] },
    });
    const dsAction = actionsCfg().items[4];
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
    test('isCompare 但无 lastValues 时不进入对比', () => {
      const wrapper = mount(EventSelect, {
        props: baseProps({ isCompare: true, model: { events: [] } }) as any,
      });
      expect(wrapper.findComponent({ name: 'MGroupList' }).props('isCompare')).toBe(false);
    });

    test('对比模式向内部透传 isCompare 与 lastValues', () => {
      const lastValues = { events: [{ name: 'a', actions: [] }] };
      const wrapper = mount(EventSelect, {
        props: baseProps({
          isCompare: true,
          model: { events: [{ name: 'a', actions: [] }] },
          lastValues,
        }) as any,
      });
      const list = wrapper.findComponent({ name: 'MGroupList' });
      expect(list.props('isCompare')).toBe(true);
      expect(list.props('lastValues')).toEqual(lastValues);
    });
  });
});
