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

import { afterEach, describe, expect, test } from 'vitest';
import { builtInFields, clearFields, registerBuiltInFields, submitForm, validateForm } from '@form/headless';

afterEach(() => {
  clearFields();
});

describe('@tmagic/form/headless', () => {
  test('纯 Node 环境可登记内置字段并校验', async () => {
    registerBuiltInFields(builtInFields);

    const error = await validateForm({
      config: [{ type: 'text', name: 'username', text: '用户名', rules: [{ required: true, message: '必填' }] }],
      initValues: { username: '' },
    });

    expect(error).toContain('用户名');
    expect(error).toContain('必填');

    const values = await submitForm({
      config: [{ type: 'text', name: 'username', text: '用户名', rules: [{ required: true, message: '必填' }] }],
      initValues: { username: 'ok' },
    });
    expect(values.username).toBe('ok');
  });

  test('dialog: true 在 headless 入口直接拒绝', async () => {
    await expect(
      validateForm({
        config: [{ type: 'text', name: 'username' }],
        dialog: true,
      }),
    ).rejects.toThrow('@tmagic/form/headless');
  });
});
