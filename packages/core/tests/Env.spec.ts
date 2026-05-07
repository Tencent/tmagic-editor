/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { describe, expect, test } from 'vitest';

import Env from '../src/Env';
import FlowState from '../src/FlowState';
import Store from '../src/Store';

describe('Env', () => {
  test('空 ua 时所有标识为 false', () => {
    const env = new Env('');
    expect(env.isIos).toBe(false);
    expect(env.isAndroid).toBe(false);
    expect(env.isWeb).toBe(false);
  });

  test('iPhone ua 解析为 isIos / isIphone', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
    const env = new Env(ua);
    expect(env.isIphone).toBe(true);
    expect(env.isIos).toBe(true);
    expect(env.isAndroid).toBe(false);
    expect(env.isWeb).toBe(false);
  });

  test('iPad ua 解析为 isIpad / isIos', () => {
    const ua = 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)';
    const env = new Env(ua);
    expect(env.isIpad).toBe(true);
    expect(env.isIos).toBe(true);
  });

  test('Android phone vs Android pad', () => {
    const phone = new Env('Mozilla/5.0 (Linux; Android 13; Mobile)');
    expect(phone.isAndroid).toBe(true);
    expect(phone.isAndroidPad).toBe(false);

    const pad = new Env('Mozilla/5.0 (Linux; Android 13; Tablet)');
    expect(pad.isAndroid).toBe(true);
    expect(pad.isAndroidPad).toBe(true);
  });

  test('Mac / Windows / Wechat / 企业 QQ', () => {
    const mac = new Env('Mozilla/5.0 (Macintosh; Intel Mac OS X)');
    expect(mac.isMac).toBe(true);
    expect(mac.isWeb).toBe(true);

    const win = new Env('Mozilla/5.0 (Windows NT 10.0)');
    expect(win.isWin).toBe(true);

    const wechat = new Env('Mozilla/5.0 ... MicroMessenger/8.0');
    expect(wechat.isWechat).toBe(true);

    const qq = new Env('Mozilla/5.0 ... QQ/8.0.0');
    expect(qq.isMqq).toBe(true);

    const wxwork = new Env('MicroMessenger/8.0 wxwork/4.0');
    expect(wxwork.isWechat).toBe(false);
  });

  test('OpenHarmony 时 isWeb 为 false', () => {
    const env = new Env('Mozilla/5.0 OpenHarmony 4.0');
    expect(env.isOpenHarmony).toBe(true);
    expect(env.isWeb).toBe(false);
  });

  test('支持自定义扩展属性', () => {
    const env = new Env('Mozilla/5.0 (Macintosh; Intel Mac OS X)', { custom: 'value', isWin: true });
    expect((env as any).custom).toBe('value');
    expect(env.isWin).toBe(true);
  });
});

describe('Store', () => {
  test('默认 initialData', () => {
    const store = new Store();
    expect(store.get('foo')).toBeUndefined();
  });

  test('set / get', () => {
    const store = new Store();
    store.set('foo', 'bar');
    expect(store.get('foo')).toBe('bar');
  });

  test('使用自定义 initialData', () => {
    const store = new Store({ initialData: { a: 1, b: 2 } });
    expect(store.get('a')).toBe(1);
    expect(store.get('b')).toBe(2);
  });

  test('set 覆盖 initialData 中的值', () => {
    const store = new Store({ initialData: { a: 1 } });
    store.set('a', 100);
    expect(store.get('a')).toBe(100);
  });
});

describe('FlowState', () => {
  test('初始 isAbort 为 false', () => {
    const fs = new FlowState();
    expect(fs.isAbort).toBe(false);
  });

  test('abort 后 isAbort 为 true，reset 后恢复', () => {
    const fs = new FlowState();
    fs.abort();
    expect(fs.isAbort).toBe(true);
    fs.reset();
    expect(fs.isAbort).toBe(false);
  });
});
