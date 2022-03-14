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

import { createApp } from 'vue';
import ElementPlus from 'element-plus';

import MagicEditor, { editorService } from '@tmagic/editor';
import MagicForm from '@tmagic/form';

import App from '@src/app.vue';
import editorPlugin from '@src/plugins/editor';
import router from '@src/router';
import installComponents from '@src/use/use-comp';

import 'element-plus/dist/index.css';
import '@tmagic/editor/dist/style.css';
import '@tmagic/form/dist/style.css';

const app = createApp(App);
app.use(ElementPlus);
app.use(MagicEditor);
editorService.usePlugin(editorPlugin);
app.use(MagicForm);
app.use(router);
installComponents(app);
app.mount('#app');
