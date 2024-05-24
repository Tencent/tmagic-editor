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

import { App } from 'vue';
import axios, { AxiosResponse } from 'axios';

const requestHandler = function (config: Record<any, any>) {
  return config;
};

const responseHandler = function (response: AxiosResponse) {
  return response;
};

export const service = axios.create({
  withCredentials: true,
  timeout: 7000,
});

service.interceptors.request.use(requestHandler);
service.interceptors.response.use(responseHandler);

export default {
  install(app: App) {
    app.provide('request', service);
  },
};
