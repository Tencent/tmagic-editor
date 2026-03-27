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
import { beforeEach, describe, expect, test } from 'vitest';

import { UndoRedo } from '@editor/utils/undo-redo';

describe('undo', () => {
  let undoRedo: UndoRedo;

  beforeEach(() => {
    undoRedo = new UndoRedo();
  });

  test('can not undo: empty list', () => {
    expect(undoRedo.canUndo()).toBe(false);
    expect(undoRedo.undo()).toEqual(null);
  });

  test('can undo after one push', () => {
    undoRedo.pushElement({ a: 1 });
    expect(undoRedo.canUndo()).toBe(true);
    expect(undoRedo.undo()).toEqual({ a: 1 });
    expect(undoRedo.canUndo()).toBe(false);
  });

  test('can undo returns the operation being undone', () => {
    undoRedo.pushElement({ a: 1 });
    undoRedo.pushElement({ a: 2 });
    expect(undoRedo.canUndo()).toBe(true);
    expect(undoRedo.undo()).toEqual({ a: 2 });
    expect(undoRedo.canUndo()).toBe(true);
    expect(undoRedo.undo()).toEqual({ a: 1 });
    expect(undoRedo.canUndo()).toBe(false);
  });
});

describe('redo', () => {
  let undoRedo: UndoRedo;

  beforeEach(() => {
    undoRedo = new UndoRedo();
  });

  test('can not redo: empty list', () => {
    expect(undoRedo.canRedo()).toBe(false);
    expect(undoRedo.redo()).toBe(null);
  });

  test('can not redo: no undo', () => {
    for (let i = 0; i < 5; i++) {
      undoRedo.pushElement({ a: i });
      expect(undoRedo.canRedo()).toBe(false);
      expect(undoRedo.redo()).toBe(null);
    }
  });

  test('can not redo: undo and push', () => {
    undoRedo.pushElement({ a: 1 });
    undoRedo.pushElement({ a: 2 });
    undoRedo.undo();
    undoRedo.pushElement({ a: 3 });
    expect(undoRedo.canRedo()).toBe(false);
    expect(undoRedo.redo()).toEqual(null);
  });

  test('can not redo: redo end', () => {
    undoRedo.pushElement({ a: 1 });
    undoRedo.pushElement({ a: 2 });
    undoRedo.undo();
    undoRedo.undo();
    undoRedo.redo();
    undoRedo.redo();

    expect(undoRedo.canRedo()).toBe(false);
    expect(undoRedo.redo()).toEqual(null);
  });

  test('can redo', () => {
    undoRedo.pushElement({ a: 1 });
    undoRedo.pushElement({ a: 2 });
    undoRedo.undo();
    undoRedo.undo();

    expect(undoRedo.canRedo()).toBe(true);
    expect(undoRedo.redo()).toEqual({ a: 1 });
    expect(undoRedo.canRedo()).toBe(true);
    expect(undoRedo.redo()).toEqual({ a: 2 });
  });
});

describe('get current element', () => {
  let undoRedo: UndoRedo;

  beforeEach(() => {
    undoRedo = new UndoRedo();
  });

  test('no element', () => {
    expect(undoRedo.getCurrentElement()).toEqual(null);
  });

  test('has element', () => {
    undoRedo.pushElement({ a: 1 });
    expect(undoRedo.getCurrentElement()).toEqual({ a: 1 });
  });
});

describe('list max size', () => {
  let undoRedo: UndoRedo;
  const listMaxSize = 100;

  beforeEach(() => {
    undoRedo = new UndoRedo(listMaxSize);
  });

  test('reach max size', () => {
    for (let i = 0; i <= listMaxSize; i++) {
      undoRedo.pushElement({ a: i });
    }

    expect(undoRedo.getCurrentElement()).toEqual({ a: listMaxSize });
    expect(undoRedo.canRedo()).toBe(false);
    expect(undoRedo.canUndo()).toBe(true);
  });

  test('reach max size, then undo all', () => {
    for (let i = 0; i <= listMaxSize; i++) {
      undoRedo.pushElement({ a: i });
    }
    for (let i = 0; i < listMaxSize; i++) {
      undoRedo.undo();
    }

    expect(undoRedo.canUndo()).toBe(false);
    expect(undoRedo.getCurrentElement()).toEqual(null);
  });
});
