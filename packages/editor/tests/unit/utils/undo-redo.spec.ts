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

  test('listMaxSize 小于最小值时回退到最小值 2', () => {
    const small = new UndoRedo(1);
    small.pushElement({ a: 1 });
    small.pushElement({ a: 2 });
    small.pushElement({ a: 3 });
    expect(small.getCurrentElement()).toEqual({ a: 3 });
    expect(small.undo()).toEqual({ a: 3 });
    expect(small.undo()).toEqual({ a: 2 });
    expect(small.canUndo()).toBe(false);
  });
});

describe('updateCurrentElement / updateElements', () => {
  test('updateCurrentElement 就地更新当前游标元素', () => {
    const undoRedo = new UndoRedo();
    undoRedo.pushElement({ a: 1 });
    undoRedo.pushElement({ a: 2 });
    undoRedo.updateCurrentElement((el: any) => {
      el.saved = true;
    });
    expect(undoRedo.getCurrentElement()).toEqual({ a: 2, saved: true });
    // 撤销后当前元素是更早的那条，不应被标记
    expect(undoRedo.undo()).toEqual({ a: 2, saved: true });
    expect(undoRedo.getCurrentElement()).toEqual({ a: 1 });
  });

  test('updateCurrentElement 在 cursor 为 0 时不做任何操作', () => {
    const undoRedo = new UndoRedo();
    undoRedo.pushElement({ a: 1 });
    undoRedo.undo();
    let called = false;
    undoRedo.updateCurrentElement(() => {
      called = true;
    });
    expect(called).toBe(false);
  });

  test('updateElements 遍历就地更新全部元素', () => {
    const undoRedo = new UndoRedo();
    undoRedo.pushElement({ a: 1, saved: true });
    undoRedo.pushElement({ a: 2 });
    undoRedo.updateElements((el: any) => {
      el.saved = false;
    });
    const list = undoRedo.getElementList() as any[];
    expect(list.every((el) => el.saved === false)).toBe(true);
  });
});

describe('serialize / fromSerialized', () => {
  test('serialize 导出快照并 fromSerialized 完整还原（含游标）', () => {
    const undoRedo = new UndoRedo(50);
    undoRedo.pushElement({ a: 1 });
    undoRedo.pushElement({ a: 2 });
    undoRedo.pushElement({ a: 3 });
    undoRedo.undo(); // cursor = 2

    const data = undoRedo.serialize();
    expect(data.elementList).toHaveLength(3);
    expect(data.listCursor).toBe(2);
    expect(data.listMaxSize).toBe(50);

    const restored = UndoRedo.fromSerialized(data);
    expect(restored.getCursor()).toBe(2);
    expect(restored.getLength()).toBe(3);
    expect(restored.getCurrentElement()).toEqual({ a: 2 });
    expect(restored.canRedo()).toBe(true);
    expect(restored.redo()).toEqual({ a: 3 });
  });

  test('serialize 为深克隆，修改原栈不影响快照', () => {
    const undoRedo = new UndoRedo();
    const el: any = { a: 1 };
    undoRedo.pushElement(el);
    const data = undoRedo.serialize();
    undoRedo.updateCurrentElement((cur: any) => {
      cur.a = 999;
    });
    expect((data.elementList[0] as any).a).toBe(1);
  });

  test('fromSerialized 超出 listMaxSize 时裁掉最旧记录并回退游标', () => {
    const restored = UndoRedo.fromSerialized({
      elementList: [{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }],
      listCursor: 4,
      listMaxSize: 2,
    });
    expect(restored.getLength()).toBe(2);
    // 保留最近两条，cursor 同步回退到 2
    expect(restored.getElementList()).toEqual([{ a: 3 }, { a: 4 }]);
    expect(restored.getCursor()).toBe(2);
  });

  test('fromSerialized 游标越界时夹紧到 [0, length]', () => {
    const restored = UndoRedo.fromSerialized({
      elementList: [{ a: 1 }, { a: 2 }],
      listCursor: 99,
      listMaxSize: 100,
    });
    expect(restored.getCursor()).toBe(2);
  });

  test('fromSerialized isSavedStep 把游标定位到最近一条已保存记录之后', () => {
    const restored = UndoRedo.fromSerialized<{ a: number; saved?: boolean }>(
      {
        elementList: [{ a: 1 }, { a: 2, saved: true }, { a: 3 }, { a: 4 }],
        listCursor: 4,
        listMaxSize: 100,
      },
      { isSavedStep: (el) => el.saved === true },
    );
    // 最近一条已保存记录在 index 1，游标应为 2
    expect(restored.getCursor()).toBe(2);
    expect(restored.getCurrentElement()).toEqual({ a: 2, saved: true });
  });

  test('fromSerialized isSavedStep 无匹配时退回原游标', () => {
    const restored = UndoRedo.fromSerialized<{ a: number; saved?: boolean }>(
      {
        elementList: [{ a: 1 }, { a: 2 }],
        listCursor: 1,
        listMaxSize: 100,
      },
      { isSavedStep: (el) => el.saved === true },
    );
    expect(restored.getCursor()).toBe(1);
  });
});
