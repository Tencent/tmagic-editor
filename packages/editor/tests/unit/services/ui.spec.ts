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

import ui from '@editor/services/ui';

describe('ui service', () => {
  test('init', () => {
    ui.set('uiSelectMode', true);
    expect(ui.get('uiSelectMode')).toBeTruthy();
    expect(ui.get('showSrc')).toBeFalsy();
  });

  test('zoom 累加并保留 0.1 下限', async () => {
    ui.set('zoom', 1);
    await ui.zoom(0.2);
    expect(ui.get('zoom')).toBeCloseTo(1.2);

    ui.set('zoom', 0.05);
    await ui.zoom(0);
    expect(ui.get('zoom')).toBe(0.1);
  });

  test('calcZoom 当容器无尺寸时返回 1', async () => {
    ui.set('stageContainerRect', { width: 0, height: 0 });
    const z = await ui.calcZoom();
    expect(z).toBe(1);
  });

  test('calcZoom 容器更大时返回 1', async () => {
    ui.set('stageContainerRect', { width: 2000, height: 2000 });
    const z = await ui.calcZoom();
    expect(z).toBe(1);
  });

  test('calcZoom 容器较小时返回 < 1', async () => {
    ui.set('stageContainerRect', { width: 200, height: 300 });
    const z = await ui.calcZoom();
    expect(z).toBeLessThan(1);
  });

  test('resetState 清零', () => {
    ui.set('zoom', 2);
    ui.set('uiSelectMode', true);
    ui.resetState();
    expect(ui.get('zoom')).toBe(1);
    expect(ui.get('uiSelectMode')).toBe(false);
  });

  test('set stageRect 内部走 setStageRect', () => {
    ui.set('stageRect', { width: 414, height: 800 });
    expect(ui.get('stageRect').width).toBe(414);
    expect(ui.get('stageRect').height).toBe(800);
  });
});
