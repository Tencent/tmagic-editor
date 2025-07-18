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

import { createRouter, createWebHashHistory } from 'vue-router';

import Editor from './pages/Editor.vue';
import Form from './pages/Form.vue';
import FormEditor from './pages/FormEditor.vue';
import Table from './pages/Table.vue';

const routes = [
  { path: '/', component: Editor },
  { path: '/form', component: Form },
  { path: '/form-editor', component: FormEditor },
  { path: '/table', component: Table },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
