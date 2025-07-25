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
import { describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import { NodeType } from '@tmagic/core';

import Stage from '@editor/layouts/workspace/viewer/Stage.vue';
import editorService from '@editor/services/editor';
import keybindingService from '@editor/services/keybinding';
import stageOverlayService from '@editor/services/stageOverlay';
import storageService from '@editor/services/storage';
import uiService from '@editor/services/ui';

globalThis.ResizeObserver =
  globalThis.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }));

describe('Stage.vue', () => {
  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      text: () => `<!DOCTYPE html>
          <html lang="en" style="font-size: 100px">
            <head></head>
            <body></body>
          </html>`,
    }),
  );

  const page = {
    type: NodeType.PAGE,
    id: '2',
    items: [
      {
        type: 'text',
        id: '3',
      },
    ],
  };

  const wrapper = mount(Stage as any, {
    global: {
      provide: {
        services: {
          editorService,
          uiService,
          stageOverlayService,
          storageService,
          keybindingService,
        },
      },
    },

    props: {
      runtimeUrl: '',
      root: {
        id: '1',
        type: NodeType.ROOT,
        items: [page],
      },
      stageContentMenu: [],
      page,
      node: page,
      uiSelectMode: false,
      customContentMenu: (menu: any) => menu,
    },
  });

  test('基础', () => {
    const stage = wrapper.findComponent(Stage);
    expect(stage.exists()).toBe(true);
  });
});
