/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import MagicForm, { MForm, MSelect } from '@form/index';
import { setConfig } from '@form/utils/config';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

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
