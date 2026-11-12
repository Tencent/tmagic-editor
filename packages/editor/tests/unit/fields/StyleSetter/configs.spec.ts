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
import { describe, expect, test, vi } from 'vitest';

import {
  borderRadiusConfig,
  createBackgroundConfig,
  createBorderDirectionConfig,
  createFontConfig,
  createLayoutConfig,
  createPositionConfig,
  createStyleSetterConfig,
  transformConfig,
} from '@editor/fields/StyleSetter/configs';

type Item = Record<string, any>;

const find = (config: Item[], name: string): Item => {
  const item = config.find((it) => it.name === name);
  if (!item) throw new Error(`missing config: ${name}`);
  return item;
};

const values = (options: Item[] = []) => options.map((option) => option.value);

describe('StyleSetter configs CSS 关键字', () => {
  const validateDataSourceField = vi.fn(() => undefined);
  const layout = createLayoutConfig('default') as Item[];
  const background = createBackgroundConfig() as Item[];
  const font = createFontConfig(validateDataSourceField as any) as Item[];

  test('textAlign 覆盖 CSS 对齐关键字', () => {
    expect(values(find(font, 'textAlign').options)).toEqual([
      'left',
      'center',
      'right',
      'start',
      'end',
      'justify',
      'match-parent',
    ]);

    // 只保留图标，避免字数不同的文案撑出不等宽按钮、换行后边框错位；中文说明留在 tooltip
    const { options } = find(font, 'textAlign');
    expect(options.every((option: Item) => Boolean(option.icon) && !option.text && Boolean(option.tooltip))).toBe(true);
  });

  test('display 覆盖常用布局模式且每项都有图标', () => {
    expect(find(layout, 'display').options.every((option: Item) => Boolean(option.icon))).toBe(true);
    expect(values(find(layout, 'display').options)).toEqual([
      'inline',
      'flex',
      'block',
      'inline-block',
      'none',
      'inline-flex',
      'grid',
      'inline-grid',
    ]);
  });

  test('新增的对齐 / 重复选项都使用图标按钮', () => {
    const fields: [Item[], string][] = [
      [layout, 'justifyContent'],
      [layout, 'alignItems'],
      [background, 'backgroundRepeat'],
      [font, 'textAlign'],
    ];

    fields.forEach(([config, name]) => {
      expect(find(config, name).options.every((option: Item) => Boolean(option.icon))).toBe(true);
    });
  });

  test('justifyContent 补 space-evenly，alignItems 补合法对齐值', () => {
    expect(values(find(layout, 'justifyContent').options)).toEqual([
      'flex-start',
      'flex-end',
      'center',
      'space-between',
      'space-around',
      'space-evenly',
    ]);
    expect(values(find(layout, 'alignItems').options)).toEqual([
      'flex-start',
      'flex-end',
      'center',
      'space-between',
      'space-around',
      'stretch',
      'baseline',
      'normal',
      'start',
      'end',
    ]);
  });

  test('flexDirection / flexWrap 保持完整', () => {
    expect(values(find(layout, 'flexDirection').options)).toEqual(['row', 'row-reverse', 'column', 'column-reverse']);
    expect(values(find(layout, 'flexWrap').options)).toEqual(['nowrap', 'wrap', 'wrap-reverse']);
  });

  test('backgroundRepeat 补 space / round', () => {
    expect(values(find(background, 'backgroundRepeat').options)).toEqual([
      'no-repeat',
      'repeat-x',
      'repeat-y',
      'repeat',
      'space',
      'round',
    ]);
    expect(values(find(background, 'backgroundSize').options)).toEqual(['auto', 'contain', 'cover']);
  });

  test('fontWeight 覆盖 100-900 与相对关键字', () => {
    expect(values(find(font, 'fontWeight').fieldConfig.options)).toEqual([
      'normal',
      'bold',
      'bolder',
      'lighter',
      ...Array(9)
        .fill(1)
        .map((_x, i) => `${i + 1}00`),
    ]);
  });

  test('borderStyle 覆盖全部 CSS 线型', () => {
    const border = createBorderDirectionConfig('') as Item;
    const styleItem = border.items.find((it: Item) => it.name === 'borderStyle');
    expect(values(styleItem.fieldConfig.options)).toEqual([
      'none',
      'hidden',
      'dotted',
      'dashed',
      'solid',
      'double',
      'groove',
      'ridge',
      'inset',
      'outset',
    ]);
  });

  test('overflow / position 的关键字保持完整', () => {
    const overflow = layout.find((it) => it.type === 'row' && it.items?.[0]?.name === 'overflow');
    expect(values(overflow.items[0].fieldConfig.options)).toEqual([
      'visible',
      'hidden',
      'clip',
      'scroll',
      'auto',
      'overlay',
      'initial',
    ]);

    const position = createPositionConfig({ position: 'static' }) as Item[];
    expect(values(find(position, 'position').fieldConfig.options)).toEqual([
      'static',
      'relative',
      'absolute',
      'fixed',
      'sticky',
    ]);
  });

  test('flex 相关字段仅在 display 为 flex 时展示', () => {
    ['flexDirection', 'justifyContent', 'alignItems', 'flexWrap'].forEach((name) => {
      expect(find(layout, name).display(null, { model: { display: 'flex' } })).toBe(true);
      expect(find(layout, name).display(null, { model: { display: 'block' } })).toBe(false);
    });
  });

  test('position 为 static 时隐藏方位字段', () => {
    const position = createPositionConfig({ position: 'static' }) as Item[];
    expect(position.filter((it) => it.type === 'row').every((it) => it.display() === false)).toBe(true);
  });

  test('backgroundSize 校验覆盖空值、关键字、多值与非法值', () => {
    const { validator } = find(background, 'backgroundSize').rules[1];
    const check = (value: any) => {
      const callback = vi.fn();
      validator({ value, callback }, {}, null);
      return callback;
    };

    expect(check('')).toHaveBeenCalledWith();
    expect(check(null)).toHaveBeenCalledWith();
    expect(check('cover')).toHaveBeenCalledWith();
    expect(check('inherit')).toHaveBeenCalledWith();
    expect(check('100px 50%')).toHaveBeenCalledWith();
    expect(check('cover contain')).toHaveBeenCalledWith('cover/contain 不能与其他值组合');
    expect(check('10px 20px 30px')).toHaveBeenCalledWith('backgroundSize 最多支持两个值');
    expect(check('foo')).toHaveBeenCalledWith('backgroundSize 值不合法');
  });

  test('fontWeight 校验委托给 validateDataSourceField 并校验普通值', () => {
    const validate = vi.fn((value, _ctx, opts) => opts.validatePlainValue(value));
    const { validator } = find(createFontConfig(validate as any) as Item[], 'fontWeight').rules[1];
    const ctx = { config: {}, model: {}, prop: '' };
    const check = (value: any) => {
      const callback = vi.fn();
      validator({ value, callback }, ctx, null);
      return callback;
    };

    expect(check('')).toHaveBeenCalledWith();
    expect(check('700')).toHaveBeenCalledWith(undefined);
    expect(check(700)).toHaveBeenCalledWith(undefined);
    expect(check({})).toHaveBeenCalledWith('字重应为字符串或数字');
    expect(validate).toHaveBeenCalledTimes(3);
  });

  test('fontWeight 校验支持异步校验结果', async () => {
    const validate = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce('数据源错误');
    const { validator } = find(createFontConfig(validate as any) as Item[], 'fontWeight').rules[1];
    const ctx = { config: {}, model: {}, prop: '' };

    const resolved = vi.fn();
    validator({ value: '700', callback: resolved }, ctx, null);
    await vi.waitFor(() => expect(resolved).toHaveBeenCalledWith(undefined));

    const rejected = vi.fn();
    validator({ value: '700', callback: rejected }, ctx, null);
    await vi.waitFor(() => expect(rejected).toHaveBeenCalledWith('数据源错误'));
  });

  test('合成配置按面板顺序包含各字段', () => {
    const config = createStyleSetterConfig({}, 'default', validateDataSourceField as any) as Item[];
    const names = config.flatMap((it) => (it.name ? [it.name] : (it.items || []).map((sub: Item) => sub.name)));

    expect(names).toContain('display');
    expect(names).toContain('opacity');
    expect(names).toContain('position');
    expect(names).toContain('backgroundRepeat');
    expect(names).toContain('fontWeight');
    expect(names).toContain('textAlign');
    expect(borderRadiusConfig.name).toBe('borderRadius');
    expect(transformConfig.items.map((it: Item) => it.name)).toEqual(['rotate', 'scale']);
  });
});
