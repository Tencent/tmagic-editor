/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 */
import { describe, expect, test, vi } from 'vitest';

import App from '@tmagic/core';

import { HttpDataSource } from '@data-source/data-sources';

const createSchema = (overrides: Partial<any> = {}) => ({
  type: 'http',
  id: 'http_1',
  fields: [{ name: 'name' }],
  methods: [],
  events: [],
  options: {
    url: 'https://example.com/api',
    method: 'GET',
    params: {},
    data: {},
    headers: {},
  },
  ...overrides,
});

describe('HttpDataSource 基础', () => {
  test('实例化时记录 httpOptions / type', () => {
    const ds = new HttpDataSource({
      schema: createSchema() as any,
      app: new App({}),
    });
    expect(ds).toBeInstanceOf(HttpDataSource);
    expect(ds.type).toBe('http');
    expect(ds.httpOptions.url).toBe('https://example.com/api');
  });

  test('优先使用自定义 request', async () => {
    const request = vi.fn().mockResolvedValue({ name: 'from-request' });
    const ds = new HttpDataSource({
      schema: createSchema() as any,
      app: new App({}),
      request,
    });
    await ds.request();
    expect(request).toHaveBeenCalled();
    expect(ds.data.name).toBe('from-request');
    expect(ds.error).toBeUndefined();
  });

  test('autoFetch=true 在 init 时主动请求', async () => {
    const request = vi.fn().mockResolvedValue({ name: 'auto' });
    const ds = new HttpDataSource({
      schema: createSchema({ autoFetch: true }) as any,
      app: new App({}),
      request,
    });
    await ds.init();
    expect(request).toHaveBeenCalledTimes(1);
    expect(ds.isInit).toBe(true);
  });

  test('beforeRequest / afterResponse 钩子被调用', async () => {
    const beforeRequest = vi.fn(async (opt: any) => ({ ...opt, params: { extra: 1 } }));
    const afterResponse = vi.fn(async (res: any) => ({ ...res, name: 'after' }));
    const request = vi.fn().mockResolvedValue({ name: 'origin' });
    const ds = new HttpDataSource({
      schema: createSchema({ beforeRequest, afterResponse }) as any,
      app: new App({}),
      request,
    });
    await ds.request();
    expect(beforeRequest).toHaveBeenCalled();
    expect(afterResponse).toHaveBeenCalled();
    expect(ds.data.name).toBe('after');
  });

  test('responseOptions.dataPath 截取响应字段', async () => {
    const request = vi.fn().mockResolvedValue({ data: { name: 'inner' } });
    const ds = new HttpDataSource({
      schema: createSchema({ responseOptions: { dataPath: 'data' } }) as any,
      app: new App({}),
      request,
    });
    await ds.request();
    expect(ds.data.name).toBe('inner');
  });

  test('请求失败时填充 error 并触发 error 事件', async () => {
    const request = vi.fn().mockRejectedValue(new Error('boom'));
    const ds = new HttpDataSource({
      schema: createSchema() as any,
      app: new App({}),
      request,
    });
    const errorHandler = vi.fn();
    ds.on('error', errorHandler);
    await ds.request();
    expect(ds.isLoading).toBe(false);
    expect(ds.error?.msg).toBe('boom');
    expect(errorHandler).toHaveBeenCalled();
  });

  test('GET / POST 包装方法', async () => {
    const request = vi.fn().mockResolvedValue({ name: 'ok' });
    const ds = new HttpDataSource({
      schema: createSchema() as any,
      app: new App({}),
      request,
    });
    await ds.get({ url: 'https://x.com/g' });
    expect(request.mock.calls[0][0].method).toBe('GET');

    await ds.post({ url: 'https://x.com/p' });
    expect(request.mock.calls[1][0].method).toBe('POST');
  });

  test('options 中 url/params 等可以是函数', async () => {
    const request = vi.fn().mockResolvedValue({});
    const ds = new HttpDataSource({
      schema: createSchema({
        options: {
          url: ({ dataSource }: any) => `https://x/${dataSource.id}`,
          params: () => ({ p: 1 }),
          data: () => ({ d: 1 }),
          headers: () => ({ 'X-Custom': '1' }),
        },
      }) as any,
      app: new App({}),
      request,
    });
    await ds.request();
    const opt = request.mock.calls[0][0];
    expect(opt.url).toBe('https://x/http_1');
    expect(opt.params).toEqual({ p: 1 });
    expect(opt.data).toEqual({ d: 1 });
    expect(opt.headers).toEqual({ 'X-Custom': '1' });
  });

  test('编辑器中使用 mockData 而非真实请求', async () => {
    const request = vi.fn();
    const app = new App({}) as any;
    app.platform = 'editor';
    const ds = new HttpDataSource({
      schema: createSchema({
        mocks: [{ useInEditor: true, data: { name: 'mock-name' } }],
      }) as any,
      app,
      request,
    });
    await ds.request();
    expect(request).not.toHaveBeenCalled();
    expect(ds.data.name).toBe('mock-name');
  });

  test('beforeRequest/afterRequest method 被注册', async () => {
    const before = vi.fn();
    const after = vi.fn();
    const request = vi.fn().mockResolvedValue({});
    const ds = new HttpDataSource({
      schema: createSchema({
        methods: [
          { name: 'b', timing: 'beforeRequest', content: before, params: [] },
          { name: 'a', timing: 'afterRequest', content: after, params: [] },
          { name: 'noop', content: 'not-a-function' as any, params: [] },
        ],
      }) as any,
      app: new App({}),
      request,
    });
    await ds.request();
    expect(before).toHaveBeenCalled();
    expect(after).toHaveBeenCalled();
  });
});

describe('webRequest 默认实现', () => {
  test('未传自定义 request 时使用 fetch，非 GET 携带 body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ name: 'fetched' }),
    });
    const original = globalThis.fetch;
    (globalThis as any).fetch = fetchMock;
    try {
      const ds = new HttpDataSource({
        schema: createSchema({
          options: {
            url: 'https://x.com/api',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: { foo: 'bar' },
            params: { q: 'v' },
          },
        }) as any,
        app: new App({}),
      });
      await ds.request();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('q=v');
      expect(init.method).toBe('POST');
      expect(init.body).toContain('foo');
      expect(ds.data.name).toBe('fetched');
    } finally {
      (globalThis as any).fetch = original;
    }
  });

  test('Content-Type 为 form-urlencoded 时 body 用 url 编码', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({}) });
    const original = globalThis.fetch;
    (globalThis as any).fetch = fetchMock;
    try {
      const ds = new HttpDataSource({
        schema: createSchema({
          options: {
            url: 'https://x.com/api',
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: { a: 1, b: { x: 1 }, c: undefined },
          },
        }) as any,
        app: new App({}),
      });
      await ds.request();
      const [, init] = fetchMock.mock.calls[0];
      expect(init.body).toContain('a=1');
      expect(init.body).toContain('b=');
      expect(init.body).not.toContain('c=');
    } finally {
      (globalThis as any).fetch = original;
    }
  });
});
