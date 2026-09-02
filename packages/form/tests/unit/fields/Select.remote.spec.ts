/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

/**
 * 远程模式下的滚动分页依赖 `tMagicSelect.value.scrollbarWrap`，而真实 ElSelect 并不暴露它，
 * 因此这里替换掉 TMagicSelect，换成一个只暴露所需实例方法的壳组件。
 *
 * 壳组件不渲染默认插槽：el-option 需要 inject ElSelect 的上下文，脱离真实 select 会报错，
 * 而这批用例只关心脚本里的远程加载逻辑，不关心选项怎么渲染。
 */
const selectStub = {
  scrollbarWrap: undefined as HTMLElement | undefined,
  setQuery: vi.fn(),
  setPreviousQuery: vi.fn(),
  setSelectedLabel: vi.fn(),
  setSelected: vi.fn(),
};

vi.mock('@tmagic/design', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tmagic/design')>()),
  TMagicSelect: defineComponent({
    name: 'TMagicSelectStub',
    props: { modelValue: null, remoteMethod: { type: Function, default: undefined } },
    emits: ['update:modelValue', 'visible-change'],
    setup(_props, { expose }) {
      expose(selectStub);
      return () => h('div', { class: 'stub-select' });
    },
  }),
}));

const MagicForm = (await import('@form/index')).default;
const { MForm, MSelect } = await import('@form/index');
const { setConfig } = await import('@form/utils/config');

let request: ReturnType<typeof vi.fn>;

const flushAsync = async () => {
  await nextTick();
  await new Promise((r) => setTimeout(r, 0));
  await nextTick();
};

const mountSelect = (config: any, initValues: any = {}) =>
  mount(MForm, {
    global: { plugins: [ElementPlus as any, [MagicForm as any, { request }]] },
    props: { config: [{ name: 's', type: 'select', text: 's', ...config }], initValues },
  });

const getStub = (wrapper: any) => wrapper.findComponent({ name: 'TMagicSelectStub' });

/**
 * 远程用例统一带上 initUrl。
 *
 * MForm 会把无初值的字段初始化成 ''（不是 undefined），而 getInitOption 在没有 initUrl 时
 * 会直接落到 getInitLocalOption 去打列表接口，把结果缓存进 localOptions——后续 getOptions
 * 就命中缓存不再发请求，远程分支全都测不到。带上 initUrl 后，空值会在 init 的空值守卫处
 * 提前返回，localOptions 保持为空，展开 / 搜索 / 触底才会真正走远程加载。
 */
const remoteOption = (extra: any = {}) => ({
  url: 'https://example.com/list',
  initUrl: 'https://example.com/init',
  root: 'data.list',
  totalKey: 'total',
  ...extra,
});

beforeEach(() => {
  const wrap = document.createElement('div');
  selectStub.scrollbarWrap = wrap;
  selectStub.setQuery.mockClear();
  selectStub.setPreviousQuery.mockClear();
  selectStub.setSelectedLabel.mockClear();
  selectStub.setSelected.mockClear();

  request = vi.fn(async () => ({ data: { list: [{ text: 'A', value: 'a' }] }, total: 50 }));
  setConfig({ request });
});

afterEach(() => {
  setConfig({});
});

describe('Select - visibleHandler', () => {
  test('下拉收起时不触发请求', async () => {
    const wrapper = mountSelect({
      remote: true,
      option: remoteOption(),
    });
    await flushAsync();
    request.mockClear();

    getStub(wrapper).vm.$emit('visible-change', false);
    await flushAsync();

    expect(request).not.toHaveBeenCalled();
  });

  test('非 remote 配置展开下拉时不触发请求', async () => {
    const wrapper = mountSelect({ option: remoteOption() });
    await flushAsync();
    request.mockClear();

    getStub(wrapper).vm.$emit('visible-change', true);
    await flushAsync();

    expect(request).not.toHaveBeenCalled();
  });

  test('remote 展开且选项不足时拉取选项', async () => {
    const wrapper = mountSelect({
      remote: true,
      option: remoteOption(),
    });
    await flushAsync();
    request.mockClear();

    getStub(wrapper).vm.$emit('visible-change', true);
    await flushAsync();

    expect(request).toHaveBeenCalledTimes(1);
    expect((wrapper.findComponent(MSelect).vm as any).options).toEqual([{ text: 'A', value: 'a' }]);
  });

  test('已有搜索词时展开下拉，回填搜索状态而不重新拉取', async () => {
    const wrapper = mountSelect({
      remote: true,
      option: remoteOption(),
    });
    await flushAsync();

    // 先通过远程搜索写入 query
    await getStub(wrapper).props('remoteMethod')('kw');
    await flushAsync();
    request.mockClear();

    getStub(wrapper).vm.$emit('visible-change', true);
    await flushAsync();

    expect(selectStub.setQuery).toHaveBeenCalledWith('kw');
    expect(selectStub.setPreviousQuery).toHaveBeenCalledWith('kw');
    expect(selectStub.setSelectedLabel).toHaveBeenCalledWith('kw');
    expect(request).not.toHaveBeenCalled();
  });
});

describe('Select - remoteMethod', () => {
  test('远程搜索会重置分页并按关键词请求', async () => {
    const wrapper = mountSelect({
      remote: true,
      option: remoteOption(),
    });
    await flushAsync();
    request.mockClear();

    await getStub(wrapper).props('remoteMethod')('kw');
    await flushAsync();

    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0].data).toMatchObject({ query: 'kw', pgIndex: 0 });
  });

  test('多选远程搜索后刷新已选状态', async () => {
    const wrapper = mountSelect(
      {
        remote: true,
        multiple: true,
        option: remoteOption(),
      },
      { s: [] },
    );
    await flushAsync();

    await getStub(wrapper).props('remoteMethod')('kw');
    await flushAsync();

    expect(selectStub.setSelected).toHaveBeenCalled();
  });

  test('已有本地选项时远程搜索不再请求', async () => {
    // 无 initUrl：初始化会走 getInitLocalOption，把结果缓存进 localOptions
    const wrapper = mountSelect(
      {
        remote: true,
        option: { url: 'https://example.com/list', root: 'data.list' },
      },
      { s: 'a' },
    );
    await flushAsync();
    request.mockClear();

    await getStub(wrapper).props('remoteMethod')('kw');
    await flushAsync();

    expect(request).not.toHaveBeenCalled();
  });
});

describe('Select - 滚动分页', () => {
  const scrollToBottom = async (wrapper: any) => {
    selectStub.scrollbarWrap!.dispatchEvent(new Event('scroll'));
    await flushAsync();
    return wrapper;
  };

  const remoteConfig = { remote: true, option: remoteOption() };

  test('触底且仍有剩余数据时加载下一页', async () => {
    const wrapper = mountSelect(remoteConfig);
    await flushAsync();

    // 先展开一次填充 options 与 total（total=50 > 已加载 1 条）
    getStub(wrapper).vm.$emit('visible-change', true);
    await flushAsync();
    request.mockClear();

    await scrollToBottom(wrapper);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0].data).toMatchObject({ pgIndex: 1 });
  });

  test('已加载条数达到总数时触底不再请求', async () => {
    request = vi.fn(async () => ({ data: { list: [{ text: 'A', value: 'a' }] }, total: 1 }));
    setConfig({ request });

    const wrapper = mountSelect(remoteConfig);
    await flushAsync();
    getStub(wrapper).vm.$emit('visible-change', true);
    await flushAsync();
    request.mockClear();

    await scrollToBottom(wrapper);

    expect(request).not.toHaveBeenCalled();
  });

  test('未触底时不加载下一页', async () => {
    const wrapper = mountSelect(remoteConfig);
    await flushAsync();
    getStub(wrapper).vm.$emit('visible-change', true);
    await flushAsync();
    request.mockClear();

    // 距底部还有距离
    Object.defineProperty(selectStub.scrollbarWrap!, 'scrollHeight', { value: 500, configurable: true });
    Object.defineProperty(selectStub.scrollbarWrap!, 'clientHeight', { value: 100, configurable: true });
    await scrollToBottom(wrapper);

    expect(request).not.toHaveBeenCalled();
  });
});

describe('Select - 多选保留已选项', () => {
  test('新一页结果不含已选项时，已选项仍保留在选项列表里', async () => {
    // initUrl 让初始化走 init 接口，localOptions 保持为空，
    // 这样后续展开下拉才会真正调用列表接口
    request = vi.fn(async (postOptions: Record<string, any>) => {
      if (postOptions.url.includes('init')) {
        return { data: { list: [{ text: 'A', value: 'a' }] } };
      }
      return { data: { list: [{ text: 'B', value: 'b' }] }, total: 50 };
    });
    setConfig({ request });

    const wrapper = mountSelect(
      {
        remote: true,
        multiple: true,
        option: {
          url: 'https://example.com/list',
          initUrl: 'https://example.com/init',
          initRoot: 'data.list',
          root: 'data.list',
          totalKey: 'total',
        },
      },
      { s: ['a'] },
    );
    await flushAsync();

    expect((wrapper.findComponent(MSelect).vm as any).options).toEqual([{ text: 'A', value: 'a' }]);

    getStub(wrapper).vm.$emit('visible-change', true);
    await flushAsync();

    expect((wrapper.findComponent(MSelect).vm as any).options).toEqual([
      { text: 'A', value: 'a' },
      { text: 'B', value: 'b' },
    ]);
  });
});

describe('Select - changeHandler', () => {
  test('选中值变化时向上抛 change', async () => {
    const wrapper = mountSelect({ options: [{ text: 'A', value: 'a' }] }, { s: '' });
    await flushAsync();

    getStub(wrapper).vm.$emit('update:modelValue', 'a');
    await flushAsync();

    expect(wrapper.findComponent(MSelect).emitted('change')?.[0]).toEqual(['a']);
  });
});
