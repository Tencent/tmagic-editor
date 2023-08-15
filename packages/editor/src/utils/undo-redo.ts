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

import { cloneDeep } from 'lodash-es';

export class UndoRedo<T = any> {
  private elementList: T[];
  private listCursor: number;
  private listMaxSize: number;

  constructor(listMaxSize = 20) {
    const minListMaxSize = 2;
    this.elementList = [];
    this.listCursor = 0;
    this.listMaxSize = listMaxSize > minListMaxSize ? listMaxSize : minListMaxSize;
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
    return this.listCursor > 1;
  }

  // 返回undo后的当前元素
  public undo(): T | null {
    if (!this.canUndo()) {
      return null;
    }
    this.listCursor -= 1;
    return this.getCurrentElement();
  }

  public canRedo() {
    return this.elementList.length > this.listCursor;
  }

  // 返回redo后的当前元素
  public redo(): T | null {
    if (!this.canRedo()) {
      return null;
    }
    this.listCursor += 1;
    return this.getCurrentElement();
  }

  public getCurrentElement(): T | null {
    if (this.listCursor < 1) {
      return null;
    }
    return cloneDeep(this.elementList[this.listCursor - 1]);
  }
}
