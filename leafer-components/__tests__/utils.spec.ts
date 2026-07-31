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

import { describe, expect, it } from 'vitest'

import {
  normalizeColor,
  parseFontWeight,
  parseGradient,
  parsePx,
  parseShadow,
} from '../src/utils'

describe('parsePx', () => {
  it('returns undefined for null / undefined / empty', () => {
    expect(parsePx(null)).toBeUndefined()
    expect(parsePx(undefined)).toBeUndefined()
    expect(parsePx('')).toBeUndefined()
  })

  it('parses number as-is', () => {
    expect(parsePx(100)).toBe(100)
    expect(parsePx(0)).toBe(0)
    expect(parsePx(-12.5)).toBe(-12.5)
  })

  it('parses "100" / "100px" to 100', () => {
    expect(parsePx('100')).toBe(100)
    expect(parsePx('100px')).toBe(100)
    expect(parsePx('-50px')).toBe(-50)
    expect(parsePx('12.5px')).toBe(12.5)
  })

  it('converts pt to px (×1.333)', () => {
    expect(parsePx('10pt')).toBeCloseTo(13.33, 1)
  })

  it('returns undefined for % / auto', () => {
    expect(parsePx('50%')).toBeUndefined()
    expect(parsePx('auto')).toBeUndefined()
  })

  it('handles non-finite gracefully', () => {
    expect(parsePx(NaN)).toBeUndefined()
    expect(parsePx(Infinity)).toBeUndefined()
  })
})

describe('parseShadow', () => {
  it('returns undefined for empty / none', () => {
    expect(parseShadow(undefined)).toBeUndefined()
    expect(parseShadow(null)).toBeUndefined()
    expect(parseShadow('')).toBeUndefined()
    expect(parseShadow('none')).toBeUndefined()
  })

  it('parses basic box-shadow', () => {
    const result = parseShadow('0 2px 8px rgba(0, 0, 0, 0.15)')
    expect(result).toEqual({
      x: 0,
      y: 2,
      blur: 8,
      spread: 0,
      color: 'rgba(0, 0, 0, 0.15)',
      inset: false,
    })
  })

  it('parses inset shadow', () => {
    const result = parseShadow('inset 0 1px 0 #fff')
    expect(result?.inset).toBe(true)
    expect(result?.color).toBe('#fff')
  })

  it('takes first shadow from multiple', () => {
    const result = parseShadow('0 1px 2px red, 0 2px 4px blue')
    expect(result?.color).toBe('red')
  })
})

describe('parseGradient', () => {
  it('returns undefined for non-gradient', () => {
    expect(parseGradient(undefined)).toBeUndefined()
    expect(parseGradient('red')).toBeUndefined()
  })

  it('parses linear-gradient with default angle', () => {
    const result = parseGradient('linear-gradient(red, blue)')
    expect(result?.type).toBe('linear')
    if (result?.type === 'linear') {
      expect(result.stops).toHaveLength(2)
      expect(result.stops[0].color).toBe('red')
    }
  })

  it('parses linear-gradient with "to right"', () => {
    const result = parseGradient('linear-gradient(to right, red, blue)')
    expect(result?.type).toBe('linear')
    if (result?.type === 'linear') {
      expect(result.angle).toBe(90)
    }
  })

  it('parses linear-gradient with deg', () => {
    const result = parseGradient('linear-gradient(45deg, red, blue)')
    expect(result?.type).toBe('linear')
    if (result?.type === 'linear') {
      expect(result.angle).toBe(45)
    }
  })

  it('parses radial-gradient', () => {
    const result = parseGradient('radial-gradient(circle, red, blue)')
    expect(result?.type).toBe('radial')
  })

  it('parses conic-gradient', () => {
    const result = parseGradient('conic-gradient(red, blue, green)')
    expect(result?.type).toBe('conic')
  })
})

describe('parseFontWeight', () => {
  it('returns undefined for empty', () => {
    expect(parseFontWeight(undefined)).toBeUndefined()
    expect(parseFontWeight(null)).toBeUndefined()
  })

  it('handles named values', () => {
    expect(parseFontWeight('normal')).toBe(400)
    expect(parseFontWeight('bold')).toBe(700)
    expect(parseFontWeight('lighter')).toBe('lighter')
  })

  it('handles number / numeric string', () => {
    expect(parseFontWeight(700)).toBe(700)
    expect(parseFontWeight('500')).toBe(500)
  })
})

describe('normalizeColor', () => {
  it('returns trimmed string', () => {
    expect(normalizeColor('  #fff  ')).toBe('#fff')
    expect(normalizeColor('rgba(0,0,0,.5)')).toBe('rgba(0,0,0,.5)')
  })

  it('returns undefined for empty / non-string', () => {
    expect(normalizeColor(undefined)).toBeUndefined()
    expect(normalizeColor(null)).toBeUndefined()
    expect(normalizeColor(123)).toBeUndefined()
    expect(normalizeColor('')).toBeUndefined()
  })
})
