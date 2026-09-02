/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

import MagicForm, { MForm, MSelect } from '@form/index';
import { setConfig } from '@form/utils/config';

const mountForm = (config: any[], initValues: any = {}) =>
  mount(MForm, {
    global: { plugins: [ElementPlus as any, MagicForm as any] },
    props: { config, initValues },
  });

describe('Select', () => {
  test('数组 options 渲染', async () => {
    const wrapper = mountForm(
      [
        {
          name: 's',
          type: 'select',
          text: 's',
          options: [
            { text: 'A', value: 'a' },
            { text: 'B', value: 'b' },
          ],
        },
      ],
      { s: 'a' },
    );
    await nextTick();
    expect(wrapper.findComponent(MSelect).exists()).toBe(true);
  });

  test('options 是函数', async () => {
    const wrapper = mountForm(
      [
        {
          name: 's',
          type: 'select',
          text: 's',
          options: () => [{ text: 'A', value: 'a' }],
        },
      ],
      { s: 'a' },
    );
    await nextTick();
    await nextTick();
    expect(wrapper.findComponent(MSelect).exists()).toBe(true);
  });

  test('group 形式 options', async () => {
    const wrapper = mountForm(
      [
        {
          name: 's',
          type: 'select',
          text: 's',
          group: true,
          options: [
            {
              label: 'g1',
              options: [{ text: 'A', value: 'a' }],
            },
          ],
        },
      ],
      { s: 'a' },
    );
    await nextTick();
    expect(wrapper.findComponent(MSelect).exists()).toBe(true);
  });

  /**
   * key 必须始终取 valueKey 指向的值。曾经写成 `valueKey && option.value?.[valueKey] ? ... : option.value`，
   * 把嵌套值当布尔用，导致 `{ id: 0 }` 这类假值退化成「整个对象」当 key：
   * valueKey 被静默忽略、key 类型在数字与对象间不一致，且对象引用每次重建列表都会变，
   * Vue 只能销毁重建而非按 key 复用。对象值下拉里 id 为 0 很常见。
   */
  test('valueKey 指向假值时，key 仍取该值而非整个对象', async () => {
    const wrapper = mountForm(
      [
        {
          name: 's',
          type: 'select',
          text: 's',
          valueKey: 'id',
          options: [
            { text: 'A', value: { id: 0 } },
            { text: 'B', value: { id: 1 } },
            { text: 'C', value: { id: '' } },
          ],
        },
      ],
      { s: { id: 1 } },
    );
    await nextTick();
    await nextTick();

    const keys = wrapper.findAllComponents({ name: 'ElOption' }).map((o) => (o.vm as any).$.vnode.key);
    expect(keys).toEqual([0, 1, '']);
  });

  test('valueKey 配置下 option.value 为 null 不抛错', async () => {
    const wrapper = mountForm(
      [
        {
          name: 's',
          type: 'select',
          text: 's',
          valueKey: 'id',
          options: [
            { text: 'A', value: { id: 1 } },
            { text: 'B', value: null },
          ],
        },
      ],
      {},
    );
    await nextTick();
    await nextTick();

    const keys = wrapper.findAllComponents({ name: 'ElOption' }).map((o) => (o.vm as any).$.vnode.key);
    expect(keys).toEqual([1, null]);
  });

  test('未配置 valueKey 时 key 取 option.value 本身', async () => {
    const wrapper = mountForm(
      [
        {
          name: 's',
          type: 'select',
          text: 's',
          options: [
            { text: 'A', value: 0 },
            { text: 'B', value: 'b' },
          ],
        },
      ],
      {},
    );
    await nextTick();
    await nextTick();

    const keys = wrapper.findAllComponents({ name: 'ElOption' }).map((o) => (o.vm as any).$.vnode.key);
    expect(keys).toEqual([0, 'b']);
  });

  test('multiple 多选', async () => {
    const wrapper = mountForm(
      [
        {
          name: 's',
          type: 'select',
          text: 's',
          multiple: true,
          options: [
            { text: 'A', value: 'a' },
            { text: 'B', value: 'b' },
          ],
        },
      ],
      { s: ['a'] },
    );
    await nextTick();
    expect(wrapper.findComponent(MSelect).exists()).toBe(true);
  });
});

describe('Select - getInitOption empty value', () => {
  let request: ReturnType<typeof vi.fn>;

  const mountFormWithRequest = (config: any[], initValues: any = {}) =>
    mount(MForm, {
      global: { plugins: [ElementPlus as any, [MagicForm as any, { request }]] },
      props: { config, initValues },
    });

  beforeEach(() => {
    request = vi.fn(async () => ({ data: { list: [{ text: 'X', value: 'x' }] } }));
    setConfig({ request });
  });

  afterEach(() => {
    setConfig({});
    vi.restoreAllMocks();
  });

  const buildConfig = (extra: any = {}) => [
    {
      name: 's',
      type: 'select',
      text: 's',
      option: {
        url: 'https://example.com/list',
        initUrl: 'https://example.com/init',
        ...extra,
      },
    },
  ];

  test('value 为空字符串时不发起 init 请求且 options 为空', async () => {
    const wrapper = mountFormWithRequest(buildConfig(), { s: '' });
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();

    expect(request).not.toHaveBeenCalled();
    const select = wrapper.findComponent(MSelect);
    expect(select.exists()).toBe(true);
    expect((select.vm as any).options).toEqual([]);
  });

  test('value 为 null 时不发起 init 请求且 options 为空', async () => {
    const wrapper = mountFormWithRequest(buildConfig(), { s: null });
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();

    expect(request).not.toHaveBeenCalled();
    const select = wrapper.findComponent(MSelect);
    expect((select.vm as any).options).toEqual([]);
  });

  test('value 非空时正常发起 init 请求并填充 options', async () => {
    const wrapper = mountFormWithRequest(buildConfig({ initRoot: 'data.list' }), { s: 'x' });
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();

    expect(request).toHaveBeenCalledTimes(1);
    const callArg = request.mock.calls[0][0];
    expect(callArg.url).toBe('https://example.com/init');
    expect(callArg.data).toMatchObject({ id: 'x' });

    const select = wrapper.findComponent(MSelect);
    const opts = (select.vm as any).options;
    expect(Array.isArray(opts)).toBe(true);
    expect(opts.length).toBeGreaterThan(0);
    expect(opts[0]).toMatchObject({ text: 'X', value: 'x' });
  });

  test('value 为 undefined 时不会调用 getInitOption（onBeforeMount 已过滤）', async () => {
    const wrapper = mountFormWithRequest(buildConfig(), {});
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();

    expect(request).not.toHaveBeenCalled();
    const select = wrapper.findComponent(MSelect);
    expect((select.vm as any).options).toEqual([]);
  });

  test('未配置 initUrl 时（仅 url）走本地选项分支并发起请求', async () => {
    const wrapper = mountFormWithRequest(
      [
        {
          name: 's',
          type: 'select',
          text: 's',
          option: {
            url: 'https://example.com/list',
          },
        },
      ],
      { s: 'x' },
    );
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();

    expect(request).toHaveBeenCalled();
    expect(request.mock.calls[0][0].url).toBe('https://example.com/list');
    expect(wrapper.findComponent(MSelect).exists()).toBe(true);
  });
});

describe('Select - config.option model value watch', () => {
  let request: ReturnType<typeof vi.fn>;

  const mountFormWithRequest = (config: any[], initValues: any = {}) =>
    mount(MForm, {
      global: { plugins: [ElementPlus as any, [MagicForm as any, { request }]] },
      props: { config, initValues },
    });

  const flushAsync = async () => {
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();
  };

  const buildConfig = (extra: any = {}) => [
    {
      name: 's',
      type: 'select',
      text: 's',
      option: {
        url: 'https://example.com/list',
        initUrl: 'https://example.com/init',
        initRoot: 'data.list',
        ...extra,
      },
    },
  ];

  beforeEach(() => {
    request = vi.fn((postOptions: Record<string, any>) => {
      const id = postOptions.data?.id;
      const ids = Array.isArray(id) ? id : [id];
      return Promise.resolve({
        data: {
          list: ids.map((value: string) => ({ text: `Label-${value}`, value })),
        },
      });
    });
    setConfig({ request });
  });

  afterEach(() => {
    setConfig({});
    vi.restoreAllMocks();
  });

  test('model 值变化且 options 中无对应项时重新 getInitOption', async () => {
    const wrapper = mountFormWithRequest(buildConfig(), { s: 'x' });
    await flushAsync();

    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0].data).toMatchObject({ id: 'x' });

    const select = wrapper.findComponent(MSelect);
    expect((select.vm as any).options[0]).toMatchObject({ text: 'Label-x', value: 'x' });

    (wrapper.vm as any).values.s = 'y';
    await flushAsync();

    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1][0].url).toBe('https://example.com/init');
    expect(request.mock.calls[1][0].data).toMatchObject({ id: 'y' });
    expect((select.vm as any).options[0]).toMatchObject({ text: 'Label-y', value: 'y' });
  });

  test('model 值变化但 options 已包含对应项时不重复请求', async () => {
    const wrapper = mountFormWithRequest(buildConfig(), { s: 'x' });
    await flushAsync();

    (wrapper.vm as any).values.s = 'y';
    await flushAsync();
    expect(request).toHaveBeenCalledTimes(2);

    request.mockClear();
    (wrapper.vm as any).values.s = 'y';
    await flushAsync();

    expect(request).not.toHaveBeenCalled();
  });

  test('model 值变为 undefined 时不发起 init 请求', async () => {
    const wrapper = mountFormWithRequest(buildConfig(), { s: 'x' });
    await flushAsync();
    const callCount = request.mock.calls.length;

    (wrapper.vm as any).values.s = undefined;
    await flushAsync();

    expect(request.mock.calls.length).toBe(callCount);
  });

  test('multiple：model 值变化且缺少选项时重新 getInitOption', async () => {
    const wrapper = mountFormWithRequest(
      [
        {
          name: 's',
          type: 'select',
          text: 's',
          multiple: true,
          option: {
            url: 'https://example.com/list',
            initUrl: 'https://example.com/init',
            initRoot: 'data.list',
          },
        },
      ],
      { s: ['x'] },
    );
    await flushAsync();

    const select = wrapper.findComponent(MSelect);
    expect((select.vm as any).options).toEqual(
      expect.arrayContaining([expect.objectContaining({ text: 'Label-x', value: 'x' })]),
    );

    (wrapper.vm as any).values.s = ['x', 'y'];
    await flushAsync();

    expect(request.mock.calls.at(-1)?.[0].data).toMatchObject({ id: ['x', 'y'] });
    expect((select.vm as any).options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: 'Label-x', value: 'x' }),
        expect.objectContaining({ text: 'Label-y', value: 'y' }),
      ]),
    );
  });
});

/**
 * 无 initUrl 时走 getInitLocalOption -> getOptions（列表接口）这条路径，
 * 覆盖 option 上的各类钩子与动态取值。
 */
describe('Select - getOptions 列表接口分支', () => {
  let request: ReturnType<typeof vi.fn>;

  const mountFormWithRequest = (config: any[], initValues: any = {}) =>
    mount(MForm, {
      global: { plugins: [ElementPlus as any, [MagicForm as any, { request }]] },
      props: { config, initValues },
    });

  const flushAsync = async () => {
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();
  };

  const buildConfig = (option: any, extra: any = {}) => [{ name: 's', type: 'select', text: 's', ...extra, option }];

  beforeEach(() => {
    request = vi.fn(async () => ({ data: { list: [{ text: 'A', value: 'a' }] }, total: 50 }));
    setConfig({ request });
  });

  afterEach(() => {
    setConfig({});
    vi.restoreAllMocks();
  });

  test('url 与 body 为函数时先求值再请求，并带上分页参数', async () => {
    const url = vi.fn(async () => 'https://example.com/dyn');
    const body = vi.fn(() => ({ extra: 1 }));

    mountFormWithRequest(buildConfig({ url, body, root: 'data.list' }), { s: 'a' });
    await flushAsync();

    expect(url).toHaveBeenCalled();
    expect(body).toHaveBeenCalled();
    const arg = request.mock.calls[0][0];
    expect(arg.url).toBe('https://example.com/dyn');
    expect(arg.data).toMatchObject({ extra: 1, query: '', pgSize: 20, pgIndex: 0 });
  });

  test('beforeRequest / afterRequest 钩子可改写请求与响应', async () => {
    const beforeRequest = vi.fn(async (_mForm: any, postOptions: any) => ({
      ...postOptions,
      headers: { token: 't' },
    }));
    const afterRequest = vi.fn(async () => ({ data: { list: [{ text: 'AR', value: 'a' }] } }));

    const wrapper = mountFormWithRequest(
      buildConfig({ url: 'https://example.com/list', root: 'data.list', beforeRequest, afterRequest }),
      { s: 'a' },
    );
    await flushAsync();

    expect(beforeRequest).toHaveBeenCalled();
    expect(afterRequest).toHaveBeenCalled();
    expect(request.mock.calls[0][0].headers).toEqual({ token: 't' });
    expect((wrapper.findComponent(MSelect).vm as any).options).toEqual([{ text: 'AR', value: 'a' }]);
  });

  test('method 为 jsonp 时补 jsonpCallback', async () => {
    mountFormWithRequest(buildConfig({ url: 'https://example.com/list', root: 'data.list', method: 'jsonp' }), {
      s: 'a',
    });
    await flushAsync();

    expect(request.mock.calls[0][0]).toMatchObject({ method: 'jsonp', jsonpCallback: 'callback' });
  });

  test('自定义 jsonpCallback 优先', async () => {
    mountFormWithRequest(
      buildConfig({ url: 'https://example.com/list', root: 'data.list', method: 'JSONP', jsonpCallback: 'cb' }),
      { s: 'a' },
    );
    await flushAsync();

    expect(request.mock.calls[0][0].jsonpCallback).toBe('cb');
  });

  test('option.item 自定义映射结果，totalKey 命中时记录总数', async () => {
    request = vi.fn(async () => ({ data: { list: [{ n: 'A', v: 'a' }] }, total: 50 }));
    setConfig({ request });

    const item = vi.fn((data: any[]) => data.map((d) => ({ text: d.n, value: d.v })));
    const wrapper = mountFormWithRequest(
      buildConfig({ url: 'https://example.com/list', root: 'data.list', totalKey: 'total', item }),
      { s: 'a' },
    );
    await flushAsync();

    expect(item).toHaveBeenCalled();
    expect((wrapper.findComponent(MSelect).vm as any).options).toEqual([{ text: 'A', value: 'a' }]);
  });

  test('option.text / option.value 为函数时按函数取值', async () => {
    request = vi.fn(async () => ({ data: { list: [{ n: 'A', v: 'a' }] } }));
    setConfig({ request });

    const wrapper = mountFormWithRequest(
      buildConfig({
        url: 'https://example.com/list',
        root: 'data.list',
        text: (i: any) => `T-${i.n}`,
        value: (i: any) => i.v,
      }),
      { s: 'a' },
    );
    await flushAsync();

    expect((wrapper.findComponent(MSelect).vm as any).options).toEqual([{ text: 'T-A', value: 'a' }]);
  });

  test('valueKey 下用对象值比对，命中后不再重复请求', async () => {
    request = vi.fn(async () => ({ data: { list: [{ text: 'A', value: { id: 'a' } }] } }));
    setConfig({ request });

    const wrapper = mountFormWithRequest(
      buildConfig({ url: 'https://example.com/list', root: 'data.list' }, { valueKey: 'id' }),
      { s: { id: 'a' } },
    );
    await flushAsync();

    expect((wrapper.findComponent(MSelect).vm as any).options).toEqual([{ text: 'A', value: { id: 'a' } }]);

    // 已有匹配项，hasOption 命中后不应再打接口
    const count = request.mock.calls.length;
    (wrapper.vm as any).values.s = { id: 'a' };
    await flushAsync();
    expect(request.mock.calls.length).toBe(count);
  });

  test('group 单选：按组过滤出命中项所在的组', async () => {
    request = vi.fn(async () => ({ data: { list: [{ text: 'A', value: 'a' }] } }));
    setConfig({ request });

    const item = vi.fn(() => [
      { label: 'G1', options: [{ text: 'A', value: 'a' }] },
      { label: 'G2', options: [{ text: 'B', value: 'b' }] },
    ]);
    const wrapper = mountFormWithRequest(
      buildConfig({ url: 'https://example.com/list', root: 'data.list', item }, { group: true }),
      { s: 'a' },
    );
    await flushAsync();

    const opts = (wrapper.findComponent(MSelect).vm as any).options;
    expect(opts).toHaveLength(1);
    expect(opts[0].label).toBe('G1');
  });

  test('group 多选：按组过滤出命中项所在的组', async () => {
    request = vi.fn(async () => ({ data: { list: [] } }));
    setConfig({ request });

    const item = vi.fn(() => [
      { label: 'G1', options: [{ text: 'A', value: 1 }] },
      { label: 'G2', options: [{ text: 'B', value: 2 }] },
    ]);
    const wrapper = mountFormWithRequest(
      buildConfig({ url: 'https://example.com/list', root: 'data.list', item }, { group: true, multiple: true }),
      { s: [2] },
    );
    await flushAsync();

    const opts = (wrapper.findComponent(MSelect).vm as any).options;
    expect(opts).toHaveLength(1);
    expect(opts[0].label).toBe('G2');
  });

  test('本地选项已加载后再次触发不重复请求', async () => {
    const wrapper = mountFormWithRequest(buildConfig({ url: 'https://example.com/list', root: 'data.list' }), {
      s: 'a',
    });
    await flushAsync();
    const count = request.mock.calls.length;

    // 换一个不在 options 里的值：会再次走 getInitLocalOption，
    // 但 localOptions 已有缓存，getOptions 直接返回不再打接口
    (wrapper.vm as any).values.s = 'zzz';
    await flushAsync();

    expect(request.mock.calls.length).toBe(count);
  });
});

/**
 * initUrl 存在时走 getInitOption 这条路径，覆盖 init 专用的钩子与非数组响应。
 */
describe('Select - getInitOption 初始化接口分支', () => {
  let request: ReturnType<typeof vi.fn>;

  const mountFormWithRequest = (option: any, initValues: any = {}) =>
    mount(MForm, {
      global: { plugins: [ElementPlus as any, [MagicForm as any, { request }]] },
      props: { config: [{ name: 's', type: 'select', text: 's', option }], initValues },
    });

  const flushAsync = async () => {
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();
  };

  beforeEach(() => {
    request = vi.fn(async () => ({ data: { obj: { text: 'A', value: 'a' } } }));
    setConfig({ request });
  });

  afterEach(() => {
    setConfig({});
    vi.restoreAllMocks();
  });

  test('initUrl / initBody 为函数，且 beforeInitRequest 可改写请求', async () => {
    const initUrl = vi.fn(async () => 'https://example.com/init-dyn');
    const initBody = vi.fn(() => ({ b: 1 }));
    const beforeInitRequest = vi.fn(async (_mForm: any, postOptions: any) => ({
      ...postOptions,
      headers: { token: 't' },
    }));

    mountFormWithRequest({ initUrl, initBody, beforeInitRequest, initRoot: 'data.obj' }, { s: 'a' });
    await flushAsync();

    expect(initUrl).toHaveBeenCalled();
    expect(initBody).toHaveBeenCalled();
    expect(beforeInitRequest).toHaveBeenCalled();

    const arg = request.mock.calls[0][0];
    expect(arg.url).toBe('https://example.com/init-dyn');
    expect(arg.data).toMatchObject({ id: 'a', b: 1 });
    expect(arg.headers).toEqual({ token: 't' });
  });

  test('init 请求为 jsonp 时补 jsonpCallback', async () => {
    mountFormWithRequest({ initUrl: 'https://example.com/init', initRoot: 'data.obj', method: 'jsonp' }, { s: 'a' });
    await flushAsync();

    expect(request.mock.calls[0][0]).toMatchObject({ method: 'jsonp', jsonpCallback: 'callback' });
  });

  test('afterRequest 可改写 init 响应；非数组结果会被包成数组', async () => {
    const afterRequest = vi.fn(async () => ({ data: { obj: { text: 'ONE', value: 'a' } } }));

    const wrapper = mountFormWithRequest(
      { initUrl: 'https://example.com/init', initRoot: 'data.obj', afterRequest },
      { s: 'a' },
    );
    await flushAsync();

    expect(afterRequest).toHaveBeenCalled();
    expect((wrapper.findComponent(MSelect).vm as any).options).toEqual([{ text: 'ONE', value: 'a' }]);
  });

  test('init 结果走 option.item 自定义映射', async () => {
    request = vi.fn(async () => ({ data: { obj: [{ n: 'A', v: 'a' }] } }));
    setConfig({ request });

    const item = vi.fn((data: any[]) => data.map((d) => ({ text: d.n, value: d.v })));
    const wrapper = mountFormWithRequest(
      { initUrl: 'https://example.com/init', initRoot: 'data.obj', item },
      { s: 'a' },
    );
    await flushAsync();

    expect(item).toHaveBeenCalled();
    expect((wrapper.findComponent(MSelect).vm as any).options).toEqual([{ text: 'A', value: 'a' }]);
  });

  test('init 响应取不到数据时 options 为空', async () => {
    request = vi.fn(async () => ({}));
    setConfig({ request });

    const wrapper = mountFormWithRequest({ initUrl: 'https://example.com/init', initRoot: 'data.obj' }, { s: 'a' });
    await flushAsync();

    expect((wrapper.findComponent(MSelect).vm as any).options).toEqual([]);
  });
});
