/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';
import { mount } from '@vue/test-utils';

import Sidebar from '@editor/layouts/sidebar/Sidebar.vue';

const depService = {
  get: vi.fn((name: string) => {
    if (name === 'collecting') return false;
    if (name === 'taskLength') return 0;
    return false;
  }),
};
const uiState: Record<string, any> = reactive({});
const uiService = {
  get: vi.fn((name: string) => (name === 'sideBarActiveTabName' ? uiState.sideBarActiveTabName : { left: 200 })),
  set: vi.fn((name: string, value: any) => {
    uiState[name] = value;
  }),
};
const propsService = {
  getDisabledDataSource: vi.fn(() => false),
  getDisabledCodeBlock: vi.fn(() => false),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ depService, uiService, propsService }),
}));

vi.mock('@editor/hooks/use-editor-content-height', () => ({
  useEditorContentHeight: () => ({ height: { value: 600 } }),
}));

const dragstartHandler = vi.fn();
const dragendHandler = vi.fn();
vi.mock('@editor/hooks/use-float-box', () => ({
  useFloatBox: () => ({
    dragstartHandler,
    dragendHandler,
    floatBoxStates: { layer: { status: false }, 'code-block': { status: false }, 'data-source': { status: false } },
    showingBoxKeys: { value: [] },
  }),
}));

vi.mock('@editor/layouts/sidebar/code-block/CodeBlockListPanel.vue', () => ({
  default: { name: 'CodeBlockListPanel', render: () => null },
}));
vi.mock('@editor/layouts/sidebar/data-source/DataSourceListPanel.vue', () => ({
  default: { name: 'DataSourceListPanel', render: () => null },
}));
vi.mock('@editor/layouts/sidebar/layer/LayerPanel.vue', () => ({
  default: { name: 'LayerPanel', render: () => null },
}));
vi.mock('@editor/layouts/sidebar/ComponentListPanel.vue', () => ({
  default: { name: 'ComponentListPanel', render: () => null },
}));

const stub = (name: string) =>
  defineComponent({
    name,
    setup() {
      return () => h('div', { class: name });
    },
  });

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({ name: 'MIcon', props: ['icon'], setup: () => () => h('i', { class: 'fake-icon' }) }),
}));

vi.mock('@editor/components/FloatingBox.vue', () => ({
  default: defineComponent({
    name: 'FloatingBox',
    props: ['visible', 'width', 'height', 'title', 'position'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'floating-box' }, slots.body?.());
    },
  }),
}));

vi.mock('@editor/type', async () => {
  const actual = await vi.importActual<any>('@editor/type');
  return {
    ...actual,
    SideItemKey: {
      COMPONENT_LIST: 'component-list',
      LAYER: 'layer',
      CODE_BLOCK: 'code-block',
      DATA_SOURCE: 'data-source',
    },
    ColumnLayout: { LEFT: 'left', CENTER: 'center', RIGHT: 'right' },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  propsService.getDisabledDataSource.mockReturnValue(false);
  propsService.getDisabledCodeBlock.mockReturnValue(false);
  Object.keys(uiState).forEach((key) => delete uiState[key]);
  uiService.get.mockImplementation((name: string) =>
    name === 'sideBarActiveTabName' ? uiState.sideBarActiveTabName : { left: 200 },
  );
});

const baseProps = (extra: any = {}) => ({
  data: { type: 'tabs', status: '组件', items: ['component-list', 'layer', 'code-block', 'data-source'] },
  layerContentMenu: [],
  customContentMenu: (m: any) => m,
  ...extra,
});

describe('Sidebar', () => {
  test('渲染 4 个 sidebar header 条目', () => {
    const wrapper = mount(Sidebar, { props: baseProps() as any });
    expect(wrapper.findAll('.m-editor-sidebar-header-item').length).toBe(4);
  });

  test('disabledDataSource 时不展示 data-source', () => {
    propsService.getDisabledDataSource.mockReturnValue(true);
    const wrapper = mount(Sidebar, { props: baseProps() as any });
    expect(wrapper.findAll('.m-editor-sidebar-header-item').length).toBe(3);
  });

  test('disabledCodeBlock 时不展示 code-block', () => {
    propsService.getDisabledCodeBlock.mockReturnValue(true);
    const wrapper = mount(Sidebar, { props: baseProps() as any });
    expect(wrapper.findAll('.m-editor-sidebar-header-item').length).toBe(3);
  });

  test('点击 header item 切换 activeTabName', async () => {
    const wrapper = mount(Sidebar, { props: baseProps() as any });
    const items = wrapper.findAll('.m-editor-sidebar-header-item');
    await items[1].trigger('click');
    expect((wrapper.vm as any).activeTabName).toBe('已选组件');
  });

  test('items 为空时不渲染 sidebar', () => {
    const wrapper = mount(Sidebar, {
      props: baseProps({ data: { type: 'tabs', status: '', items: [] } }) as any,
    });
    expect(wrapper.find('.m-editor-sidebar').exists()).toBe(false);
  });

  test('sideBarItems 写入 uiService', () => {
    mount(Sidebar, { props: baseProps() as any });
    expect(uiService.set).toHaveBeenCalledWith('sideBarItems', expect.any(Array));
  });

  test('data.status 变化时同步 activeTabName', async () => {
    const wrapper = mount(Sidebar, { props: baseProps() as any });
    await wrapper.setProps({ data: { type: 'tabs', status: '数据源', items: ['data-source'] } });
    await nextTick();
    expect((wrapper.vm as any).activeTabName).toBe('数据源');
  });

  test('beforeClick 返回 false 时不切换', async () => {
    const beforeClick = vi.fn(async () => false);
    const wrapper = mount(Sidebar, {
      props: baseProps({
        data: {
          type: 'tabs',
          status: 'A',
          items: [
            { $key: 'a', text: 'A', component: stub('A'), beforeClick },
            { $key: 'b', text: 'B', component: stub('B') },
          ],
        },
      }) as any,
    });
    const items = wrapper.findAll('.m-editor-sidebar-header-item');
    await items[0].trigger('click');
    await nextTick();
    expect(beforeClick).toHaveBeenCalled();
  });

  test('dragstartHandler 触发', async () => {
    const wrapper = mount(Sidebar, { props: baseProps() as any });
    const items = wrapper.findAll('.m-editor-sidebar-header-item');
    await items[0].trigger('dragstart');
    expect(dragstartHandler).toHaveBeenCalled();
  });

  test('dragendHandler 触发', async () => {
    const wrapper = mount(Sidebar, { props: baseProps() as any });
    const items = wrapper.findAll('.m-editor-sidebar-header-item');
    await items[0].trigger('dragend');
    expect(dragendHandler).toHaveBeenCalled();
  });

  test('自定义 sidebar item 可渲染 slots 组件', async () => {
    const customPanel = stub('CustomPanel');
    const wrapper = mount(Sidebar, {
      props: baseProps({
        data: {
          type: 'tabs',
          status: '自定义',
          items: [
            {
              $key: 'custom',
              text: '自定义',
              component: customPanel,
              slots: { componentList: stub('SlotComponentList') },
            },
          ],
        },
      }) as any,
    });
    await wrapper.find('.m-editor-sidebar-header-item').trigger('click');
    expect(wrapper.find('.CustomPanel').exists()).toBe(true);
  });

  test('dep collecting 时展示 tips 区域', () => {
    depService.get.mockImplementation((name: string) => {
      if (name === 'collecting') return true;
      if (name === 'taskLength') return 3;
      return false;
    });
    const wrapper = mount(Sidebar, { props: baseProps() as any });
    expect(wrapper.find('.m-editor-sidebar-tips').exists()).toBe(true);
    expect(wrapper.find('.m-editor-sidebar-tips').text()).toContain('剩余任务：3');
  });
});
