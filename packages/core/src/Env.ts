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

class Env {
  isIos = false;
  isIphone = false;
  isIpad = false;
  isAndroid = false;
  isAndroidPad = false;
  isMac = false;
  isWin = false;
  isMqq = false;
  isWechat = false;
  isWeb = false;

  constructor(ua = globalThis.navigator.userAgent, options: Record<string, boolean | string> = {}) {
    this.isIphone = ua.indexOf('iPhone') >= 0;

    this.isIpad = /(iPad).*OS\s([\d_]+)/.test(ua);

    this.isIos = this.isIphone || this.isIpad;

    this.isAndroid = ua.indexOf('Android') >= 0;

    this.isAndroidPad = this.isAndroid && ua.indexOf('Mobile') < 0;

    this.isMac = ua.indexOf('Macintosh') >= 0;

    this.isWin = ua.indexOf('Windows') >= 0;

    this.isMqq = /QQ\/([\d.]+)/.test(ua);

    this.isWechat = ua.indexOf('MicroMessenger') >= 0 && ua.indexOf('wxwork') < 0;

    this.isWeb = !this.isIos && !this.isAndroid && !/(WebOS|BlackBerry)/.test(ua);

    Object.entries(options).forEach(([key, value]) => {
      (this as any)[key] = value;
    });
  }
}

export default Env;
