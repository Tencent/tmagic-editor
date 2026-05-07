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

import {
  ActionType,
  HookCodeType,
  HookType,
  NODE_CONDS_KEY,
  NODE_CONDS_RESULT_KEY,
  NODE_DISABLE_CODE_BLOCK_KEY,
  NODE_DISABLE_DATA_SOURCE_KEY,
  NodeType,
} from '../src/index';

describe('schema constants', () => {
  test('NODE_CONDS_KEY', () => {
    expect(NODE_CONDS_KEY).toBe('displayConds');
  });

  test('NODE_CONDS_RESULT_KEY', () => {
    expect(NODE_CONDS_RESULT_KEY).toBe('displayCondsResultReverse');
  });

  test('NODE_DISABLE_DATA_SOURCE_KEY', () => {
    expect(NODE_DISABLE_DATA_SOURCE_KEY).toBe('_tmagic_node_disabled_data_source');
  });

  test('NODE_DISABLE_CODE_BLOCK_KEY', () => {
    expect(NODE_DISABLE_CODE_BLOCK_KEY).toBe('_tmagic_node_disabled_code_block');
  });
});

describe('NodeType enum', () => {
  test('字段值正确', () => {
    expect(NodeType.CONTAINER).toBe('container');
    expect(NodeType.PAGE).toBe('page');
    expect(NodeType.ROOT).toBe('app');
    expect(NodeType.PAGE_FRAGMENT).toBe('page-fragment');
  });

  test('枚举值唯一', () => {
    const values = Object.values(NodeType);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('ActionType enum', () => {
  test('字段值正确', () => {
    expect(ActionType.COMP).toBe('comp');
    expect(ActionType.CODE).toBe('code');
    expect(ActionType.DATA_SOURCE).toBe('data-source');
  });

  test('枚举值唯一', () => {
    const values = Object.values(ActionType);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('HookType enum', () => {
  test('CODE 字段值', () => {
    expect(HookType.CODE).toBe('code');
  });
});

describe('HookCodeType enum', () => {
  test('字段值', () => {
    expect(HookCodeType.CODE).toBe('code');
    expect(HookCodeType.DATA_SOURCE_METHOD).toBe('data-source-method');
  });
});
