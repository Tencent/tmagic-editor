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

// 编辑器顶部菜单栏

import { ArrowLeft, Document, Finished } from '@element-plus/icons-vue';

import { MenuBarData } from '@tmagic/editor';

import ActInfoDrawer from '@src/components/act-info-drawer.vue';
import PublishPageList from '@src/components/publish-page-list.vue';
import router from '@src/router';
import { commitHandler } from '@src/use/use-publish';

export const topMenu = (): MenuBarData => ({
  left: [
    {
      type: 'button',
      text: '返回',
      icon: ArrowLeft,
      handler: (): void => {
        if (router) {
          router.push('/');
        }
      },
    },
  ],
  center: ['delete', 'undo', 'redo', 'zoom-in', 'zoom-out'],
  right: [
    {
      type: 'button',
      text: '保存',
      icon: Finished,
      handler: (): void => {
        commitHandler();
      },
    },
    {
      type: 'component',
      component: PublishPageList,
    },
    {
      type: 'component',
      component: ActInfoDrawer,
    },
    {
      type: 'button',
      icon: Document,
      text: '源码',
      handler: (service) => service?.uiService.set('showSrc', !service?.uiService.get('showSrc')),
    },
  ],
});
