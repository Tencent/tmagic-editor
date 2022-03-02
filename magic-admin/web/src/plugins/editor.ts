/**
 * Tencent is pleased to support the open source community by making MagicAdmin available.
 * Copyright (C) 2022 THL A29 Limited, a Tencent company. All rights reserved.
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { ElMessage, ElMessageBox } from 'element-plus';

import { MNode } from '@tmagic/schema';

import actApi from '@src/api/act';

export default {
  /**
   * 编辑器删除插件(删除前hook)
   * @returns void
   */
  beforeRemove: async () => {
    try {
      await ElMessageBox.confirm('确认删除该页面吗？', '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        center: true,
      });
    } catch (error) {
      throw new Error('delete canceled');
    }
  },
  /**
   * 编辑器删除插件(删除后hook)
   * @param {MNode} config 当前删除节点
   * @returns void
   */
  afterRemove: async (config: MNode) => {
    const pageId = Number(config.id);
    try {
      await actApi.removePage({ data: { pageId } });
      ElMessage({
        type: 'success',
        message: '页面删除成功',
      });
    } catch (error) {
      ElMessage({
        type: 'error',
        message: '页面删除失败',
      });
    }
  },
};
