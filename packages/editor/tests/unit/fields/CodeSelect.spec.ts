/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import CodeSelect from '@editor/fields/CodeSelect.vue';

const dataSourceService = {
  get: vi.fn(() => true),
  getDataSourceById: vi.fn(() => ({ title: 'DS1' })),
};
const codeBlockService = {
  getCodeContentById: vi.fn(() => ({ name: 'code-name' })),
  getEditStatus: vi.fn(() => true),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ dataSourceService, codeBlockService }),
}));

vi.mock('@tmagic/form', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    MContainer: defineComponent({
      name: 'MContainer',
      props: ['config', 'size', 'prop', 'disabled', 'lastValues', 'isCompare', 'model'],
      emits: ['change'],
      setup() {
        return () => h('div', { class: 'fake-container' });
      },
    }),
  };
});

vi.mock('@tmagic/design', () => ({
  TMagicCard: defineComponent({
    name: 'TMagicCard',
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-card' }, slots.default?.());
    },
  }),
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    setup(_p, { slots }) {
      return () => h('button', { class: 'fake-button' }, slots.default?.());
    },
  }),
}));

const baseProps = (extra: any = {}) => ({
  config: { type: 'code-select' },
  name: 'cs',
  prop: 'cs',
  model: { cs: { hookType: 'code', hookData: [{ codeType: 'code', codeId: 'c1' }] } },
  size: 'default',
  ...extra,
});

describe('CodeSelect', () => {
  test('change emit', async () => {
    const wrapper = mount(CodeSelect, { props: baseProps() as any });
    await wrapper.findComponent({ name: 'MContainer' }).vm.$emit('change', 'v', { modifyKey: 'a' });
    const evts = wrapper.emitted('change');
    expect(evts?.[0]?.[0]).toBe('v');
  });

  test('codeConfig.title 返回 codeBlock.name', () => {
    const wrapper = mount(CodeSelect, { props: baseProps() as any });
    const container = wrapper.findComponent({ name: 'MContainer' });
    const config = container.props('config') as any;
    const title = config.title(undefined, { model: { codeType: 'code', codeId: 'c1' }, index: 0 });
    expect(title).toBe('code-name');
  });

  test('codeConfig.title 数据源方法返回 ds 名称/method', () => {
    const wrapper = mount(CodeSelect, { props: baseProps() as any });
    const container = wrapper.findComponent({ name: 'MContainer' });
    const config = container.props('config') as any;
    const title = config.title(undefined, {
      model: { codeType: 'data-source-method', codeId: ['ds1', 'doFetch'] },
      index: 0,
    });
    expect(title).toBe('DS1 / doFetch');
  });

  test('codeConfig.title 数据源方法 codeId 长度<2 返回 index', () => {
    const wrapper = mount(CodeSelect, { props: baseProps() as any });
    const container = wrapper.findComponent({ name: 'MContainer' });
    const config = container.props('config') as any;
    const title = config.title(undefined, {
      model: { codeType: 'data-source-method', codeId: ['ds1'] },
      index: 5,
    });
    expect(title).toBe(5);
  });

  test('codeConfig.title 找不到 codeContent 返回 codeId 或 index', () => {
    codeBlockService.getCodeContentById.mockReturnValueOnce(null);
    const wrapper = mount(CodeSelect, { props: baseProps() as any });
    const container = wrapper.findComponent({ name: 'MContainer' });
    const config = container.props('config') as any;
    const title = config.title(undefined, { model: { codeType: 'code', codeId: 'unknown' }, index: 0 });
    expect(title).toBe('unknown');
  });

  test('空 model 时初始化为 { hookType, hookData }', () => {
    const props = baseProps({ model: { cs: undefined } });
    mount(CodeSelect, { props: props as any });
    expect((props.model.cs as any).hookData).toEqual([]);
  });

  test('codeType items 配置正确', () => {
    const wrapper = mount(CodeSelect, { props: baseProps() as any });
    const container = wrapper.findComponent({ name: 'MContainer' });
    const config = container.props('config') as any;
    const codeTypeSelect = config.items[0];
    expect(codeTypeSelect.name).toBe('codeType');
    const setModel = vi.fn();
    codeTypeSelect.onChange(undefined, 'data-source-method', { setModel });
    expect(setModel).toHaveBeenCalledWith('codeId', []);
    setModel.mockClear();
    codeTypeSelect.onChange(undefined, 'code', { setModel });
    expect(setModel).toHaveBeenCalledWith('codeId', '');
  });

  test('display 函数依据 model.codeType 返回 boolean', () => {
    const wrapper = mount(CodeSelect, { props: baseProps() as any });
    const container = wrapper.findComponent({ name: 'MContainer' });
    const config = container.props('config') as any;
    const codeIdCol = config.items[1];
    const dsCol = config.items[2];
    expect(codeIdCol.display(undefined, { model: { codeType: 'code' } })).toBe(true);
    expect(codeIdCol.display(undefined, { model: { codeType: 'data-source-method' } })).toBe(false);
    expect(dsCol.display(undefined, { model: { codeType: 'data-source-method' } })).toBe(true);
    expect(dsCol.display(undefined, { model: { codeType: 'code' } })).toBe(false);
  });

  test('codeId 单元格开启 typeMatch（存在性校验下沉到单元格）', () => {
    const wrapper = mount(CodeSelect, { props: baseProps() as any });
    const container = wrapper.findComponent({ name: 'MContainer' });
    const config = container.props('config') as any;
    const codeIdCol = config.items[1];
    const dsCol = config.items[2];
    expect(codeIdCol.type).toBe('code-select-col');
    expect(codeIdCol.rules).toEqual([{ typeMatch: true, trigger: 'change' }]);
    expect(dsCol.type).toBe('data-source-method-select');
    expect(dsCol.rules).toEqual([{ typeMatch: true, trigger: 'change' }]);
  });

  test('notEditable 调用各服务', () => {
    codeBlockService.getEditStatus.mockReturnValue(false);
    dataSourceService.get.mockReturnValue(false);
    const wrapper = mount(CodeSelect, { props: baseProps() as any });
    const container = wrapper.findComponent({ name: 'MContainer' });
    const config = container.props('config') as any;
    expect(config.items[1].notEditable()).toBe(true);
    expect(config.items[2].notEditable()).toBe(true);
    codeBlockService.getEditStatus.mockReturnValue(true);
    dataSourceService.get.mockReturnValue(true);
  });

  describe('对比模式', () => {
    test('isCompare 但无 lastValues 时不进入对比', () => {
      const wrapper = mount(CodeSelect, { props: baseProps({ isCompare: true }) as any });
      const container = wrapper.findComponent({ name: 'MContainer' });
      expect(container.props('isCompare')).toBe(false);
    });

    test('对比模式将 isCompare 与同层 lastValues[name] 透传给内部容器', () => {
      const lastValues = { cs: { hookType: 'code', hookData: [{ codeType: 'code', codeId: 'c2' }] } };
      const wrapper = mount(CodeSelect, { props: baseProps({ isCompare: true, lastValues }) as any });
      const container = wrapper.findComponent({ name: 'MContainer' });
      expect(container.props('isCompare')).toBe(true);
      // 注意：model 传入的是 model[name]，因此 lastValues 也需取同层的 lastValues[name]
      expect(container.props('lastValues')).toEqual(lastValues.cs);
    });
  });
});
