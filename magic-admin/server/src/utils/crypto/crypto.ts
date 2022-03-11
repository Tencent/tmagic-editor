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

// 活动加密
import myCrypto from 'crypto';

import config from '@src/config/key';

const algorithm = 'aes-256-cbc';
const keyStr = config.key;
const ivByte = Buffer.from(keyStr.substr(0, 16));

function encrypt(text: string) {
  const cipher = myCrypto.createCipheriv(algorithm, Buffer.from(keyStr), ivByte);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
}

function decrypt(text: string) {
  const encryptedData = text;
  const encryptedText = Buffer.from(encryptedData, 'hex');
  const decipher = myCrypto.createDecipheriv(algorithm, Buffer.from(keyStr), ivByte);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export default {
  encode(text: string): string {
    return encrypt(text);
  },

  decode(text: string): string {
    return decrypt(text);
  },
};
