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

import { JsEngine } from '@tmagic/schema';

export const style2Obj = (style: string) => {
  if (typeof style !== 'string') {
    return style;
  }

  const obj: Record<string, any> = {};
  style.split(';').forEach((element) => {
    if (!element) {
      return;
    }

    const items = element.split(':');

    let key = items.shift();
    let value = items.join(':');

    if (!key) return;

    key = key.replace(/^\s*/, '').replace(/\s*$/, '');
    value = value.replace(/^\s*/, '').replace(/\s*$/, '');

    key = key
      .split('-')
      .map((v, i) => (i > 0 ? `${v[0].toUpperCase()}${v.substr(1)}` : v))
      .join('');

    obj[key] = value;
  });
  return obj;
};

export const fillBackgroundImage = (value: string) => {
  if (value && !/^url/.test(value) && !/^linear-gradient/.test(value)) {
    return `url(${value})`;
  }
  return value;
};

export const isNumber = (value: string) => /^(-?\d+)(\.\d+)?$/.test(value);

export const getTransform = (value: Record<string, string>, jsEngine: JsEngine) => {
  if (!value) return [];

  const transform = Object.entries(value).map(([transformKey, transformValue]) => {
    if (!transformValue.trim()) return '';
    if (transformKey === 'rotate' && isNumber(transformValue)) {
      transformValue = `${transformValue}deg`;
    }

    return jsEngine !== 'hippy' ? `${transformKey}(${transformValue})` : { [transformKey]: transformValue };
  });

  if (jsEngine === 'hippy') {
    return transform;
  }
  const values = transform.join(' ');
  return !values.trim() ? 'none' : values;
};

/**
 * 将dsl中的style配置转换成css，主要是将数值转成rem为单位的样式值，例如100将被转换成1rem
 * @param style Object
 * @returns Object
 */
export const transformStyle = (style: Record<string, any> | string, jsEngine: JsEngine) => {
  if (!style) {
    return {};
  }

  let styleObj: Record<string, any> = {};
  const results: Record<string, any> = {};

  if (typeof style === 'string') {
    styleObj = style2Obj(style);
  } else {
    styleObj = { ...style };
  }

  const isHippy = jsEngine === 'hippy';

  const whiteList = ['zIndex', 'opacity', 'fontWeight'];
  Object.entries(styleObj).forEach(([key, value]) => {
    if (key === 'scale' && !results.transform && isHippy) {
      results.transform = [{ scale: value }];
    } else if (key === 'backgroundImage' && !isHippy) {
      value && (results[key] = fillBackgroundImage(value));
    } else if (key === 'transform' && typeof value !== 'string') {
      results[key] = getTransform(value, jsEngine);
    } else if (!whiteList.includes(key) && value && /^[-]?[0-9]*[.]?[0-9]*$/.test(value)) {
      results[key] = isHippy ? value : `${value / 100}rem`;
    } else {
      results[key] = value;
    }
  });

  return results;
};
