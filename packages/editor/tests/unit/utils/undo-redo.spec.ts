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
import { beforeEach, describe, expect, test } from 'vitest';

import { UndoRedo } from '@editor/utils/undo-redo';

describe('undo', () => {
  let undoRedo: UndoRedo;
  const element = { a: 1 };

  beforeEach(() => {
    undoRedo = new UndoRedo();
    undoRedo.pushElement(element);
  });

  test('can no undo: empty list', () => {
    expect(undoRedo.canUndo()).toBe(false);
    expect(undoRedo.undo()).toEqual(null);
  });

  test('can undo', () => {
    undoRedo.pushElement({ a: 2 });
    expect(undoRedo.canUndo()).toBe(true);
    expect(undoRedo.undo()).toEqual(element);
  });
});

describe('redo', () => {
  let undoRedo: UndoRedo;
  const element = { a: 1 };

  beforeEach(() => {
    undoRedo = new UndoRedo();
    undoRedo.pushElement(element);
  });

  test('can no redo: empty list', () => {
    expect(undoRedo.canRedo()).toBe(false);
    expect(undoRedo.redo()).toBe(null);
  });

  test('can no redo: no undo', () => {
    for (let i = 0; i < 5; i++) {
      undoRedo.pushElement(element);
      expect(undoRedo.canRedo()).toBe(false);
      expect(undoRedo.redo()).toBe(null);
    }
  });

  test('can no redo: undo and push', () => {
    undoRedo.pushElement(element);
    undoRedo.undo();
    undoRedo.pushElement(element);
    expect(undoRedo.canRedo()).toBe(false);
    expect(undoRedo.redo()).toEqual(null);
  });

  test('can no redo: redo end', () => {
    const element1 = { a: 1 };
    const element2 = { a: 2 };
    undoRedo.pushElement(element1);
    undoRedo.pushElement(element2);
    undoRedo.undo();
    undoRedo.undo();
    undoRedo.redo();
    undoRedo.redo();

    expect(undoRedo.canRedo()).toBe(false);
    expect(undoRedo.redo()).toEqual(null);
  });

  test('can redo', () => {
    const element1 = { a: 1 };
    const element2 = { a: 2 };
    undoRedo.pushElement(element1);
    undoRedo.pushElement(element2);
    undoRedo.undo();
    undoRedo.undo();

    expect(undoRedo.canRedo()).toBe(true);
    expect(undoRedo.redo()).toEqual(element1);
    expect(undoRedo.canRedo()).toBe(true);
    expect(undoRedo.redo()).toEqual(element2);
  });
});

describe('get current element', () => {
  let undoRedo: UndoRedo;
  const element = { a: 1 };

  beforeEach(() => {
    undoRedo = new UndoRedo();
  });

  test('no element', () => {
    expect(undoRedo.getCurrentElement()).toEqual(null);
  });

  test('has element', () => {
    undoRedo.pushElement(element);
    expect(undoRedo.getCurrentElement()).toEqual(element);
  });
});

describe('list max size', () => {
  let undoRedo: UndoRedo;
  const listMaxSize = 100;
  const element = { a: 1 };

  beforeEach(() => {
    undoRedo = new UndoRedo(listMaxSize);
    undoRedo.pushElement(element);
  });

  test('reach max size', () => {
    for (let i = 0; i < listMaxSize; i++) {
      undoRedo.pushElement({ a: i });
    }
    undoRedo.pushElement({ a: listMaxSize }); // 这个元素使得list达到maxSize，触发数据删除

    expect(undoRedo.getCurrentElement()).toEqual({ a: listMaxSize });
    expect(undoRedo.canRedo()).toBe(false);
    expect(undoRedo.canUndo()).toBe(true);
  });

  test('reach max size, then undo', () => {
    for (let i = 0; i < listMaxSize + 1; i++) {
      undoRedo.pushElement({ a: i });
    }
    for (let i = 0; i < listMaxSize - 1; i++) {
      undoRedo.undo();
    }
    const ele = undoRedo.getCurrentElement();
    undoRedo.undo();

    expect(ele?.a).toBe(1); // 经过超过maxSize被删元素之后，原本a值为0的第一个元素已经被删除，现在第一个元素a值为1
    expect(undoRedo.canUndo()).toBe(false);
    expect(undoRedo.getCurrentElement()).toEqual(element);
  });
});
