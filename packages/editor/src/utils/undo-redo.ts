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

import { cloneDeep } from 'lodash-es';

// #region SerializedUndoRedo
/**
 * UndoRedo 栈的可序列化快照，用于持久化（如写入 IndexedDB）后再还原。
 */
export interface SerializedUndoRedo<T = any> {
  /** 栈内全部元素（按时间正序，索引 0 为最早一步）。 */
  elementList: T[];
  /** 游标位置（已应用步骤数量）。 */
  listCursor: number;
  /** 栈容量上限。 */
  listMaxSize: number;
}
// #endregion SerializedUndoRedo

// #region UndoRedo
export class UndoRedo<T = any> {
  /**
   * 由 {@link UndoRedo.serialize} 产出的快照重建一个 UndoRedo 实例。
   * 游标会被夹紧到 [0, length] 区间，避免脏数据导致越界。
   *
   * @param options.isSavedStep 可选谓词：若提供，则把游标定位到「最近一条满足该谓词的记录」之后
   *   （即恢复到最近一个已保存点）；找不到匹配记录时退回快照中的原游标。
   */
  public static fromSerialized<T = any>(
    data: SerializedUndoRedo<T>,
    options: { isSavedStep?: (element: T) => boolean } = {},
  ): UndoRedo<T> {
    const undoRedo = new UndoRedo<T>(data.listMaxSize);
    const list = Array.isArray(data.elementList) ? data.elementList.map((item) => cloneDeep(item)) : [];
    let cursor = Number.isFinite(data.listCursor) ? data.listCursor : list.length;

    // 本地数据同样遵循容量上限：超出时裁掉最旧的记录（与 pushElement 的 shift 行为一致），并同步回退游标。
    const overflow = list.length - undoRedo.listMaxSize;
    if (overflow > 0) {
      list.splice(0, overflow);
      cursor -= overflow;
    }

    // 若指定了「已保存」谓词，则把游标移动到最近一条已保存记录之后；在裁剪后的 list 上查找以保证索引正确。
    if (options.isSavedStep) {
      for (let i = list.length - 1; i >= 0; i--) {
        if (options.isSavedStep(list[i])) {
          cursor = i + 1;
          break;
        }
      }
    }

    undoRedo.elementList = list;
    undoRedo.listCursor = Math.max(0, Math.min(cursor, list.length));
    return undoRedo;
  }

  private elementList: T[];
  private listCursor: number;
  private listMaxSize: number;

  constructor(listMaxSize = 100) {
    const minListMaxSize = 2;
    this.elementList = [];
    this.listCursor = 0;
    this.listMaxSize = listMaxSize > minListMaxSize ? listMaxSize : minListMaxSize;
  }

  /**
   * 导出当前栈的可序列化快照（深克隆，避免外部改动污染内部状态）。
   * 配合 {@link UndoRedo.fromSerialized} 可在持久化后完整还原撤销/重做栈。
   */
  public serialize(): SerializedUndoRedo<T> {
    return {
      elementList: this.elementList.map((item) => cloneDeep(item)),
      listCursor: this.listCursor,
      listMaxSize: this.listMaxSize,
    };
  }

  public pushElement(element: T): void {
    // 新元素进来时，把游标之外的元素全部丢弃，并把新元素放进来
    this.elementList.splice(this.listCursor, this.elementList.length - this.listCursor, cloneDeep(element));
    this.listCursor += 1;
    // 如果list中的元素超过maxSize，则移除第一个元素
    if (this.elementList.length > this.listMaxSize) {
      this.elementList.shift();
      this.listCursor -= 1;
    }
  }

  public canUndo(): boolean {
    return this.listCursor > 0;
  }

  /** 返回被撤销的操作 */
  public undo(): T | null {
    if (!this.canUndo()) {
      return null;
    }
    this.listCursor -= 1;
    return cloneDeep(this.elementList[this.listCursor]);
  }

  public canRedo() {
    return this.elementList.length > this.listCursor;
  }

  /** 返回被重做的操作 */
  public redo(): T | null {
    if (!this.canRedo()) {
      return null;
    }
    const element = cloneDeep(this.elementList[this.listCursor]);
    this.listCursor += 1;
    return element;
  }

  public getCurrentElement(): T | null {
    if (this.listCursor < 1) {
      return null;
    }
    return cloneDeep(this.elementList[this.listCursor - 1]);
  }

  /**
   * 对当前游标所在元素（cursor - 1）做就地更新；cursor 为 0（全部已撤销）时不做任何操作。
   * 用于给「当前步骤」打标记（如标记为已保存）等元数据写入场景。
   */
  public updateCurrentElement(updater: (element: T) => void): void {
    if (this.listCursor < 1) return;
    updater(this.elementList[this.listCursor - 1]);
  }

  /** 对栈内全部元素做就地更新。用于批量清理元数据（如清空所有元素的已保存标记）。 */
  public updateElements(updater: (element: T, index: number) => void): void {
    this.elementList.forEach(updater);
  }

  /**
   * 返回栈内全部元素的浅克隆数组（按时间顺序，索引 0 为最早一步）。
   * 仅用于历史面板等只读展示场景，不应直接修改返回值。
   */
  public getElementList(): T[] {
    return this.elementList.slice();
  }

  /**
   * 当前游标位置：表示已应用的步骤数量。
   * - cursor === 0 表示全部已撤销
   * - cursor === length 表示已重做到末尾
   * 历史面板用于区分"已应用 / 已撤销"两段。
   */
  public getCursor(): number {
    return this.listCursor;
  }

  /** 栈内总步数。 */
  public getLength(): number {
    return this.elementList.length;
  }
}
// #endregion UndoRedo
