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

import { computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import { editorService } from '@tmagic/editor';

import actApi from '@src/api/act';
import publishApi from '@src/api/publish';
import magicStore from '@src/store/index';
import type { ActInfo, EditorInfo, PageInfo } from '@src/typings';
import { serializeConfig } from '@src/util/utils';

let actInfoSave: ActInfo;
let pagesSave: EditorInfo;
// 根据活动id查询活动并初始化为编辑器所需格式
export const initConfigByActId = async ({ actId }: { actId: number }) => {
  const res = await actApi.getAct({ id: Number(actId) });
  if (res.ret !== 0) {
    ElMessage.error(res.msg || '活动查询失败！');
    return;
  }
  const { pages, ...actInfo } = res.data;
  const pageItems: any[] = [];
  pages?.forEach((page: PageInfo) => {
    if (page.srcCode) {
      // 可能包含组件自定义添加的code代码，并非纯粹的json对象
      /* eslint-disable-next-line */
      page.srcCode = eval(`(${page.srcCode})`);
      pageItems.push(page.srcCode.items[0]);
    } else {
      pageItems.push({
        id: page.id,
        type: 'page',
        name: page.pageTitle,
        title: page.pageTitle,
        style: {
          height: '100%',
          width: '375',
          position: 'relative',
          layout: 'absolute',
          left: 0,
          top: 0,
          backgroundColor: '#fff',
        },
        items: [],
      });
    }
  });
  const uiConfigs = {
    type: 'app',
    id: actInfo.actCryptoId,
    items: pageItems,
    abTest: actInfo.abTest || [],
  };
  magicStore.set('actInfo', actInfo);
  magicStore.set('pages', pages);
  magicStore.set('uiConfigs', uiConfigs);
  magicStore.set('editorDefaultSelected', pageItems[0]?.id);
};
// 编辑器保存方法
export const commitHandler = async () => {
  const actInfo = computed(() => magicStore.get('actInfo') as unknown as ActInfo);
  // 从magic-editor root 拿到最新的页面信息
  const root = computed(() => editorService.get('root'));
  console.log('从magic-editor root 拿到最新的页面信息: ', root);
  const rootInfo = root.value as unknown as EditorInfo;
  const rootInfoString = serializeConfig(rootInfo);
  const res = await publishApi.saveActInfo({
    data: {
      actInfo: actInfo.value,
      rootInfo: rootInfoString,
    },
  });
  if (res.ret === 0) {
    ElMessage.success({
      message: res.msg,
      type: 'success',
      onClose: () => {
        initConfigByActId({ actId: actInfo.value.actId });
      },
    });
  } else {
    ElMessage.error(res.msg);
  }
};

// 编辑器发布方法
const saveAndContinue = async (step: string) => {
  try {
    await ElMessageBox.confirm(`有修改未保存，是否先保存再${step}`, '提示', {
      confirmButtonText: `保存并${step}`,
      cancelButtonText: step,
      type: 'warning',
    });
    await commitHandler();
  } catch (err) {
    console.error(err);
  }
};
const isSaved = () => {
  const actInfo = computed<ActInfo>(() => magicStore.get('actInfo'));
  if (actInfo.value === actInfoSave || !actInfoSave) {
    const root = computed(() => editorService.get('root'));
    const newPages = root.value;
    if (pagesSave === newPages || !pagesSave) {
      return true;
    }
  }
  return false;
};
export const publishHandler = async () => {
  if (!isSaved()) {
    await saveAndContinue('发布');
    return true;
  }
  return true;
};
