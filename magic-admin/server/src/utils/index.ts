/*
 * Tencent is pleased to support the open source community by making MagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
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

import path from 'path';

import axios from 'axios';
import { createWriteStream, emptyDir } from 'fs-extra';
import momentTimezone from 'moment-timezone';
import serialize from 'serialize-javascript';
import uglifyJS from 'uglify-js';

import type { UiConfig } from '@src/typings';
import { babelTransform } from '@src/utils/transform';

/**
 * 格式化配置内容
 * @param {string} value 待格式化内容
 * @returns {string} 格式化结果
 */
const serializeConfig = function (value: UiConfig): string {
  return serialize(value, {
    space: 2,
    unsafe: true,
  }).replace(/"(\w+)":\s/g, '$1: ');
};

/**
 * 将srccode转换为distcode
 * @param {string} srcCode srcCode
 * @returns {string} distcode
 */
const configTransformDist = (srcCode: string): string => {
  let babelCode: string = babelTransform(`window.uiConfig=[${srcCode}]`);
  babelCode = babelCode.replace('window.uiConfig = [', '');
  return babelCode.substring(0, babelCode.length - 2);
};

/**
 * uglifyJS处理distcode
 * @param {string}  transConfig transConfig
 * @returns {string} 处理结果
 */
const processTransConfig = (transConfig) => {
  const code = `window.magicDSL = [${transConfig}]`;
  return uglifyJS.minify(`${code}`).code;
};

/**
 * 下载文件到本地
 * @param {string}  url 文件下载地址
 * @param {string}  filePath 文件保存目录
 * @param {string}  fileName 文件名
 * @returns {Promise} 处理结果
 */
const getFileFromUrl = async ({ url, filePath, fileName }) => {
  // 1. 文件夹清空并重新创建
  await emptyDir(filePath);
  const distPath = path.resolve(filePath, fileName);
  const writer = createWriteStream(distPath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

/**
 * 格式化时间（上海时区）
 * @param {string}  [time] 待转换时间戳，不传则获取当前时间
 * @param {string}  [formatTmp] 转换格式，不传则默认使用'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化之后的时间
 */
const getFormatTime = (time: string | number = Date.now(), formatTmp = 'YYYY-MM-DD HH:mm:ss') =>
  momentTimezone.tz(time, 'Asia/Shanghai').format(formatTmp);

export { serializeConfig, configTransformDist, processTransConfig, getFileFromUrl, getFormatTime };
