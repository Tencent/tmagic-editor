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
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import ActionManager from '../../src/ActionManager';
import type { ActionManagerConfig } from '../../src/types';

// 在 jsdom 环境下 `moveable-helper`/`moveable` 的 ESM 默认导出无法直接被
// require/import 调用，这里仅测试 ActionManager 自身的多选状态管理，将其桩掉。
// vi.mock 调用会被 vitest 自动提升到模块顶部，因此放在 import 之后无影响。
vi.mock('moveable-helper', () => ({
  default: {
    create: () => ({ clear: vi.fn() }),
  },
}));
vi.mock('moveable', () => ({
  default: class MockMoveable {
    on() {
      return this;
    }
    off() {
      return this;
    }
    destroy() {}
    request() {}
    updateRect() {}
    updateTarget() {}
  },
}));

const createConfig = (overrides: Partial<ActionManagerConfig> = {}): ActionManagerConfig => {
  const container = globalThis.document.createElement('div');
  globalThis.document.body.appendChild(container);
  return {
    container,
    getTargetElement: () => null,
    getElementsFromPoint: () => [],
    getRenderDocument: () => globalThis.document,
    getRootContainer: () => undefined,
    ...overrides,
  };
};

describe('ActionManager - alwaysMultiSelect', () => {
  let am: ActionManager | null = null;

  beforeEach(() => {
    globalThis.document.body.innerHTML = '';
  });

  afterEach(() => {
    am?.destroy();
    am = null;
  });

  test('默认配置下不会自动开启多选状态', () => {
    am = new ActionManager(createConfig());
    expect((am as any).isMultiSelectStatus).toBe(false);
    expect((am as any).alwaysMultiSelect).toBe(false);
  });

  test('alwaysMultiSelect=true 构造后即处于多选状态', () => {
    am = new ActionManager(createConfig({ alwaysMultiSelect: true }));
    expect((am as any).isMultiSelectStatus).toBe(true);
    expect((am as any).alwaysMultiSelect).toBe(true);
  });

  test('disabledMultiSelect=true 时 alwaysMultiSelect=true 也不会开启多选', () => {
    am = new ActionManager(
      createConfig({
        disabledMultiSelect: true,
        alwaysMultiSelect: true,
      }),
    );
    expect((am as any).isMultiSelectStatus).toBe(false);
    expect((am as any).disabledMultiSelect).toBe(true);
  });

  test('setAlwaysMultiSelect(true) 切换为多选状态', () => {
    am = new ActionManager(createConfig());
    expect((am as any).isMultiSelectStatus).toBe(false);

    am.setAlwaysMultiSelect(true);
    expect((am as any).alwaysMultiSelect).toBe(true);
    expect((am as any).isMultiSelectStatus).toBe(true);

    am.setAlwaysMultiSelect(false);
    expect((am as any).alwaysMultiSelect).toBe(false);
    expect((am as any).isMultiSelectStatus).toBe(false);
  });

  test('setAlwaysMultiSelect 不能突破 disabledMultiSelect 限制', () => {
    am = new ActionManager(createConfig({ disabledMultiSelect: true }));
    am.setAlwaysMultiSelect(true);
    expect((am as any).alwaysMultiSelect).toBe(true);
    expect((am as any).isMultiSelectStatus).toBe(false);
  });

  test('disableMultiSelect() 会重置多选状态', () => {
    am = new ActionManager(createConfig({ alwaysMultiSelect: true }));
    expect((am as any).isMultiSelectStatus).toBe(true);

    am.disableMultiSelect();
    expect((am as any).disabledMultiSelect).toBe(true);
    expect((am as any).isMultiSelectStatus).toBe(false);
  });

  test('enableMultiSelect() 后若 alwaysMultiSelect=true 恢复多选状态', () => {
    am = new ActionManager(createConfig({ alwaysMultiSelect: true }));
    am.disableMultiSelect();
    expect((am as any).isMultiSelectStatus).toBe(false);

    am.enableMultiSelect();
    expect((am as any).disabledMultiSelect).toBe(false);
    expect((am as any).isMultiSelectStatus).toBe(true);
  });
});
