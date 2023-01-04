/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
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

import { DEFAULT_EVENTS, DEFAULT_METHODS } from '@tmagic/core';

import events from '@editor/services/events';

describe('events', () => {
  test('init', () => {
    events.init([
      {
        title: '容器',
        items: [
          {
            icon: 'el-icon-folder-opened',
            text: '组',
            type: 'container',
            data: {
              id: 0,
              reportType: 'module',
            },
          },
          {
            icon: 'el-icon-files',
            text: '标签页(tab)',
            type: 'tabs',
            data: {
              id: 0,
              reportType: 'module',
            },
          },
        ],
      },
    ]);
    expect(events.getEvent('container')).toHaveLength(DEFAULT_EVENTS.length);
    expect(events.getMethod('container')).toHaveLength(DEFAULT_METHODS.length);
  });

  test('setEvent', () => {
    const event = [{ label: '点击', value: 'magic:common:events:click' }];
    events.setEvent('button', event);
    expect(events.getEvent('button')).toHaveLength(DEFAULT_EVENTS.length + 1);
  });

  test('setMethod', () => {
    const method = [{ label: '点击', value: 'magic:common:events:click' }];
    events.setMethod('button', method);
    expect(events.getMethod('button')).toHaveLength(DEFAULT_METHODS.length + 1);
  });
});
