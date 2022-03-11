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

import { getLogger } from 'log4js';

class Logger {
  public logger;
  constructor() {
    this.logger = getLogger();
  }
  info = (message: string) => {
    this.logger.info(message);
  };
  debug = (message: string) => {
    this.logger.debug(message);
  };
  warn = (message: string) => {
    this.logger.warn(message);
  };
  error = (message: string) => {
    this.logger.error(message);
  };
}
export default new Logger();
