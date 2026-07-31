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

import type { MComponent, MContainer, MNode } from '@tmagic/schema'

/**
 * 单一 leafer shape 节点的描述。
 * - return 一个 leafer UI:画单个独立节点
 * - return { node, children }:node 是 leafer 容器,children 是子 MNode 列表(由 ShapeRegistry 递归处理)
 * - return null:不画(占位)
 */
export type ShapeFn = (config: MComponent, ctx: ShapeContext) => IUI | ShapeWithChildren | null

export interface ShapeWithChildren {
  node: IUI
  children?: MNode[]
}

export interface ShapeContext {
  /** 通过 type 递归查子节点 shape */
  resolve(type: string): ShapeFn | undefined
  /** 由 ShapeRegistry 注入,递归调用子 shape */
  renderChildren(children: MNode[]): IUI[]
}

// ---------------------------------------------------------------------------
// 数值 / 单位 / 长度
// ---------------------------------------------------------------------------

/**
 * 把 CSS 风格的长度值解析成像素数字。
 * - 数字直接返回
 * - '100' / '100px' → 100
 * - '50%' / 'auto' / null / undefined → undefined(由调用方决定 fallback)
 */
export const parsePx = (v: unknown): number | undefined => {
  if (v == null || v === '') return undefined
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  if (typeof v !== 'string') return undefined

  const s = v.trim()
  if (s === '' || s === 'auto' || s.endsWith('%')) return undefined

  // 简单处理 px / pt / rpx
  const match = s.match(/^(-?\d+(?:\.\d+)?)\s*(px|pt|rpx)?$/i)
  if (!match) {
    const n = Number(s)
    return Number.isFinite(n) ? n : undefined
  }
  const num = parseFloat(match[1])
  if (!Number.isFinite(num)) return undefined

  const unit = (match[2] || '').toLowerCase()
  // 简单换算:rpx 设计稿 750 → px 暂时按 1:1,业务方自定义换算后续可加
  if (unit === 'pt') return num * 1.333
  return num
}

// ---------------------------------------------------------------------------
// 阴影
// ---------------------------------------------------------------------------

export interface LeaferShadow {
  x: number
  y: number
  blur: number
  spread?: number
  color?: string
  inset?: boolean
}

const parseShadowValue = (v: string): LeaferShadow | null => {
  const inset = /(^|\s)inset\b/i.test(v)
  const cleaned = v.replace(/\binset\b/gi, '').trim()

  // 从尾部找颜色 token:
  //  - rgba(...) / rgb(...)
  //  - #xxx / #xxxxxx / #xxxxxxxx
  //  - 命名颜色(red / blue / black 等,简单的几个常见值)
  let color: string | undefined
  let colorMatch: RegExpMatchArray | null
  const namedColorRegex = /(?:^|\s)(red|blue|green|black|white|yellow|orange|pink|purple|gray|grey|cyan|magenta|brown)(?=\s|$)/i
  const rgbaRegex = /rgba?\([^)]+\)/i
  const hexRegex = /#[0-9a-f]{3,8}/i

  if ((colorMatch = cleaned.match(rgbaRegex))) {
    color = colorMatch[0]
  } else if ((colorMatch = cleaned.match(hexRegex))) {
    color = colorMatch[0]
  } else if ((colorMatch = cleaned.match(namedColorRegex))) {
    color = colorMatch[1]
  }

  // 颜色剥离后,剩下的应该是 x y [blur [spread]] 数字
  const withoutColor = color
    ? cleaned.replace(colorMatch![0], '').trim()
    : cleaned
  const nums = withoutColor.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
  if (nums.length < 2) return null

  return {
    x: nums[0],
    y: nums[1],
    blur: nums[2] ?? 0,
    spread: nums[3] ?? 0,
    color,
    inset,
  }
}

/**
 * 解析 CSS box-shadow 字符串,支持:
 * - 单个阴影:'0 2px 8px rgba(0,0,0,0.15)'
 * - inset:'inset 0 1px 0 #fff'
 * - 多阴影(逗号分隔):leafer 暂时取第一个,业务方手写多阴影
 * - 'none' / null → undefined
 */
export const parseShadow = (css?: string | null): LeaferShadow | undefined => {
  if (!css || css === 'none') return undefined
  // 顶层逗号分割(避免切到 rgba() 里的逗号)
  const first = css.split(/,(?![^()]*\))/, 1)[0]?.trim()
  if (!first || first === 'none') return undefined
  const result = parseShadowValue(first)
  return result ?? undefined
}

// ---------------------------------------------------------------------------
// 渐变
// ---------------------------------------------------------------------------

export interface LeaferColorStop {
  offset: number
  color: string
}

export type LeaferFill =
  | { type: 'solid'; color: string }
  | { type: 'linear'; stops: LeaferColorStop[]; angle?: number }
  | { type: 'radial'; stops: LeaferColorStop[] }
  | { type: 'conic'; stops: LeaferColorStop[] }
  | { type: 'image'; url: string }
  | undefined

const parseColorStops = (stopsStr: string): LeaferColorStop[] => {
  // 'red, blue' / 'red 50%, blue 100%' / '#fff 0, rgba(0,0,0,.5) 100%'
  const parts = stopsStr.split(/,(?![^()]*\))/)  // 不在 () 里切
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      // 'red' / '#fff' / 'rgba(0,0,0,.5)' 后面可能带 50% / 100%
      const m = p.match(/^(.+?)\s+(\d+(?:\.\d+)?%?)?$/)
      if (!m) return { offset: 0, color: p }
      const color = m[1].trim()
      const offsetStr = m[2]
      let offset = 0
      if (offsetStr) {
        if (offsetStr.endsWith('%')) offset = parseFloat(offsetStr) / 100
        else offset = parseFloat(offsetStr) / 360  // 角度 → 0..1
      }
      return { offset, color }
    })
}

/**
 * 解析 CSS 渐变字符串成 leafer 内部结构。
 * 支持 linear / radial / conic;不支持 / 解析失败 → undefined,让调用方 fallback 到 solid color。
 */
export const parseGradient = (css: string | undefined | null): LeaferFill => {
  if (!css) return undefined
  const s = css.trim()

  const linearMatch = s.match(/^linear-gradient\(\s*(.+)\)$/i)
  if (linearMatch) {
    const inside = linearMatch[1]
    const result: { type: 'linear'; stops: LeaferColorStop[]; angle?: number } = { type: 'linear', stops: [] }
    // 检查是否以 'to xxx' 开头
    const toMatch = inside.match(/^to\s+(top|bottom|left|right|top\s+left|...)/i)
    if (toMatch) {
      // 简化为角度:top=0, right=90, bottom=180, left=270
      const dir = toMatch[1].toLowerCase()
      const map: Record<string, number> = { top: 0, right: 90, bottom: 180, left: 270 }
      result.angle = map[dir.replace(/\s+/g, '')] ?? 180
      result.stops = parseColorStops(inside.slice(toMatch[0].length).trim())
    } else {
      const degMatch = inside.match(/^(-?\d+(?:\.\d+)?)\s*(?:deg|rad|turn)?,?/i)
      if (degMatch) {
        let deg = parseFloat(degMatch[1])
        if (degMatch[0].includes('rad')) deg = (deg * 180) / Math.PI
        else if (degMatch[0].includes('turn')) deg = deg * 360
        result.angle = deg
        result.stops = parseColorStops(inside.slice(degMatch[0].length).trim())
      } else {
        result.stops = parseColorStops(inside)
      }
    }
    return result
  }

  const radialMatch = s.match(/^radial-gradient\(\s*(.+)\)$/i)
  if (radialMatch) {
    return { type: 'radial', stops: parseColorStops(radialMatch[1]) }
  }

  const conicMatch = s.match(/^conic-gradient\(\s*(.+)\)$/i)
  if (conicMatch) {
    return { type: 'conic', stops: parseColorStops(conicMatch[1]) }
  }

  return undefined
}

// ---------------------------------------------------------------------------
// 字号 / 字体
// ---------------------------------------------------------------------------

export const parseFontWeight = (v: unknown): number | string | undefined => {
  if (v == null) return undefined
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const s = v.trim()
    if (s === 'normal') return 400
    if (s === 'bold') return 700
    if (s === 'lighter' || s === 'bolder') return s
    const n = parseInt(s, 10)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

// ---------------------------------------------------------------------------
// 颜色
// ---------------------------------------------------------------------------

/**
 * 把 CSS 颜色字符串透传给 leafer(leafer canvas 原生支持 css color 格式)。
 * 支持:hex / rgb / rgba / 颜色名 / 'transparent' / 'inherit'。
 */
export const normalizeColor = (v: unknown): string | undefined => {
  if (v == null) return undefined
  if (typeof v === 'string') return v.trim() || undefined
  return undefined
}

// ---------------------------------------------------------------------------
// 占位 Rect(供简单 shape 复用)
// ---------------------------------------------------------------------------

// 不在此文件直接 import Rect,以免测试环境加载 leafer-ui canvas 依赖。
// 占位 Rect 的实现见 ./placeholder.ts
