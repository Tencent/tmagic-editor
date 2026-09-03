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

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { computed } from 'vue';

import events from '@editor/services/events';

describe('events', () => {
  beforeEach(() => {
    events.resetState();
  });

  test('setEvent', () => {
    const event = [{ label: '点击', value: 'magic:common:events:click' }];
    events.setEvent('button', event);
    expect(events.getEvent('button')).toHaveLength(1);
  });

  test('setMethod', () => {
    const method = [{ label: '点击', value: 'magic:common:events:click' }];
    events.setMethod('button', method);
    expect(events.getMethod('button', { targetId: 'btn_1' })).toHaveLength(1);
  });

  test('setEvents 批量设置', () => {
    events.setEvents({
      Image: [{ label: 'click', value: 'click' }],
      Text: [{ label: 'init', value: 'init' }],
    } as any);
    expect(events.getEvent('image')).toHaveLength(1);
    expect(events.getEvent('text')).toHaveLength(1);
  });

  test('setEvents 增量合并，不动入参中不存在的类型', () => {
    events.setEvents({
      Image: [{ label: 'click', value: 'click' }],
      Text: [{ label: 'init', value: 'init' }],
    } as any);
    events.setEvents({
      Image: [{ label: 'hover', value: 'hover' }],
    } as any);
    expect(events.getEvent('image')).toEqual([{ label: 'hover', value: 'hover' }]);
    expect(events.getEvent('text')).toEqual([{ label: 'init', value: 'init' }]);
  });

  test('setEvents 空对象是空操作', () => {
    events.setEvent('button', [{ label: 'click', value: 'click' }]);
    events.setEvents({});
    expect(events.getEvent('button')).toEqual([{ label: 'click', value: 'click' }]);
  });

  test('setEvents 入参类型名按 toLine 归一后写入', () => {
    events.setEvent('foo-bar', [{ label: 'a', value: 'a' }]);
    events.setEvents({
      fooBar: [{ label: 'b', value: 'b' }],
    } as any);
    expect(events.getEvent('foo-bar')).toEqual([{ label: 'b', value: 'b' }]);
  });

  test('setEvents 缺省列表按空数组写入', () => {
    events.setEvents({ button: undefined } as any);
    expect(events.getEvent('button')).toEqual([]);
  });

  test('setMethods 批量设置', () => {
    events.setMethods({
      Image: [{ label: 'show', value: 'show' }],
    } as any);
    expect(events.getMethod('image', {})).toHaveLength(1);
  });

  test('setMethods 增量合并，不动入参中不存在的类型', () => {
    events.setMethods({
      Image: [{ label: 'show', value: 'show' }],
      Video: [{ label: 'play', value: 'play' }],
    } as any);
    events.setMethods({
      Video: [{ label: 'pause', value: 'pause' }],
    } as any);
    expect(events.getMethod('video', {})).toEqual([{ label: 'pause', value: 'pause' }]);
    expect(events.getMethod('image', {})).toEqual([{ label: 'show', value: 'show' }]);
  });

  test('setMethods 缺省列表按空数组写入', () => {
    events.setMethods({ video: undefined } as any);
    expect(events.getMethod('video')).toEqual([]);
  });

  test('setMethods 空对象是空操作', () => {
    events.setMethod('button', [{ label: 'open', value: 'open' }]);
    events.setMethods({});
    expect(events.getMethod('button')).toEqual([{ label: 'open', value: 'open' }]);
  });

  test('getEvent / getMethod 支持节点上下文参数', () => {
    const node = { id: 'n1', type: 'button' } as any;
    events.setEvent('button', [{ label: '点击', value: 'click' }]);
    events.setMethod('button', [{ label: '打开', value: 'open' }]);
    expect(events.getEvent('button', { node })).toEqual([{ label: '点击', value: 'click' }]);
    expect(events.getMethod('button', { targetId: 'n1', node })).toEqual([{ label: '打开', value: 'open' }]);
  });

  test('未注册类型返回空数组', () => {
    expect(events.getEvent('not-exist')).toEqual([]);
    expect(events.getMethod('not-exist')).toEqual([]);
  });

  test('resetState 清空所有事件 / 方法', () => {
    events.setEvent('foo', [{ label: 'l', value: 'v' }]);
    events.setMethod('foo', [{ label: 'm', value: 'm' }]);
    events.resetState();
    expect(events.getEvent('foo')).toEqual([]);
    expect(events.getMethod('foo')).toEqual([]);
  });

  test('resetState 原地清空后仍可继续写入', () => {
    events.setEvent('foo', [{ label: 'l', value: 'v' }]);
    events.resetState();
    events.setEvent('bar', [{ label: 'click', value: 'click' }]);
    events.setMethod('bar', [{ label: 'open', value: 'open' }]);
    expect(events.getEvent('bar')).toEqual([{ label: 'click', value: 'click' }]);
    expect(events.getMethod('bar')).toEqual([{ label: 'open', value: 'open' }]);
  });

  test('resetState 原地清空会使已有 computed 失效', () => {
    events.setEvent('foo', [{ label: 'l', value: 'v' }]);
    events.setMethod('foo', [{ label: 'm', value: 'm' }]);
    const eventList = computed(() => events.getEvent('foo'));
    const methodList = computed(() => events.getMethod('foo'));
    expect(eventList.value).toHaveLength(1);
    expect(methodList.value).toHaveLength(1);
    events.resetState();
    expect(eventList.value).toEqual([]);
    expect(methodList.value).toEqual([]);
  });

  test('切换 runtime 版本：宿主先 resetState 再写入新版本事件表', () => {
    events.setEvents({
      button: [{ label: 'click', value: 'click' }],
      video: [{ label: 'play', value: 'play' }],
    } as any);

    // 是否清掉上一个版本的数据由业务决定，需要清掉时自行调用 resetState
    events.resetState();
    events.setEvents({ button: [{ label: 'click', value: 'click' }] } as any);

    expect(events.getEvent('video')).toEqual([]);
    expect(events.getEvent('button')).toHaveLength(1);
  });

  test('usePlugin 钩子生效，destroy 后重置状态并移除插件', () => {
    const afterGetEvent = vi.fn((result: any[]) => [...result, { label: 'extra', value: 'extra' }]);
    events.usePlugin({ afterGetEvent } as any);
    events.setEvent('button', [{ label: 'click', value: 'click' }]);
    expect(events.getEvent('button')).toHaveLength(2);

    events.destroy();
    expect(events.getEvent('button')).toEqual([]);

    events.setEvent('button', [{ label: 'click', value: 'click' }]);
    expect(events.getEvent('button')).toHaveLength(1);
    expect(afterGetEvent).toHaveBeenCalled();
  });
});
