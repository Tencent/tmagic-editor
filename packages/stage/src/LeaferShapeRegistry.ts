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

import type { IUI } from 'leafer-ui'

import type { MComponent, MNode } from '@tmagic/core'

/**
 * Shape 函数契约(由 @leafer-components 导出,这里复用其结构避免循环依赖)。
 * 这里只声明类型,实际实现见 @leafer-components/src/utils.ts。
 */
export type ShapeFn = (config: MComponent, ctx: ShapeContext) => IUI | ShapeWithChildren | null

export interface ShapeWithChildren {
  node: IUI
  children?: MNode[]
}

export interface ShapeContext {
  resolve(type: string): ShapeFn | undefined
  renderChildren(children: MNode[]): IUI[]
}

/**
 * editor 端的 shape 注册中心。
 *
 * 业务方:
 *   import buttonShape from '@leafer-components/button'
 *   editor.registerShape('button', buttonShape)
 *
 * @tmagic/stage 不依赖 leafer-components,只通过 ShapeFn 类型契约对接。
 */
export class LeaferShapeRegistry {
  private shapes: Map<string, ShapeFn> = new Map()

  /** 注册一个 shape,后注册的会覆盖前注册的 */
  public register(type: string, shape: ShapeFn): this {
    this.shapes.set(type, shape)
    return this
  }

  /** 批量注册 */
  public registerAll(map: Record<string, ShapeFn>): this {
    for (const [type, shape] of Object.entries(map)) {
      this.register(type, shape)
    }
    return this
  }

  public get(type: string): ShapeFn | undefined {
    return this.shapes.get(type)
  }

  public has(type: string): boolean {
    return this.shapes.has(type)
  }

  public list(): string[] {
    return Array.from(this.shapes.keys())
  }

  public unregister(type: string): boolean {
    return this.shapes.delete(type)
  }

  public clear(): void {
    this.shapes.clear()
  }
}

export default LeaferShapeRegistry
