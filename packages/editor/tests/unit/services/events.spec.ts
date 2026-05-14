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

import events from '@editor/services/events';

describe('events', () => {
  test('setEvent', () => {
    const event = [{ label: '点击', value: 'magic:common:events:click' }];
    events.setEvent('button', event);
    expect(events.getEvent('button')).toHaveLength(1);
  });

  test('setMethod', () => {
    const method = [{ label: '点击', value: 'magic:common:events:click' }];
    events.setMethod('button', method);
    expect(events.getMethod('button', '')).toHaveLength(1);
  });

  test('setEvents 批量设置', () => {
    events.setEvents({
      Image: [{ label: 'click', value: 'click' }],
      Text: [{ label: 'init', value: 'init' }],
    } as any);
    expect(events.getEvent('image')).toHaveLength(1);
    expect(events.getEvent('text')).toHaveLength(1);
  });

  test('setMethods 批量设置', () => {
    events.setMethods({
      Image: [{ label: 'show', value: 'show' }],
    } as any);
    expect(events.getMethod('image', '')).toHaveLength(1);
  });

  test('未注册类型返回空数组', () => {
    expect(events.getEvent('not-exist')).toEqual([]);
    expect(events.getMethod('not-exist', '')).toEqual([]);
  });

  test('resetState 清空所有事件 / 方法', () => {
    events.setEvent('foo', [{ label: 'l', value: 'v' }]);
    events.resetState();
    expect(events.getEvent('foo')).toEqual([]);
  });
});
