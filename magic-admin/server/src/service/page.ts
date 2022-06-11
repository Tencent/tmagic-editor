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

import { cloneDeep } from 'lodash';

import { PageStatus } from '@src/config/config';
import { Page } from '@src/models/page';
import SequelizeHelper from '@src/sequelize/index';
import type { PageInfo } from '@src/typings';
import { configTransformDist, getFormatTime, serializeConfig } from '@src/utils/index';
import logger from '@src/utils/logger';

export default class PageService {
  /**
   * 新建页面
   * @param {Page} page 页面参数
   * @returns {Page} 新建页面
   */
  create = (page?: Partial<Page>) => {
    const newPage = {
      pageCreateTime: getFormatTime(),
      pageModifyTime: getFormatTime(),
      pagePublishStatus: PageStatus.MODIFYING,
      pageTitle: 'index',
      pageName: 'index',
      ...page,
    };
    return Page.create(newPage as Page);
  };

  /**
   * 判断是否buffer类型
   * @param {any} val 待判定参数
   * @returns {Boolean} 判断结果
   */
  isBuffer = (val: any) => val && typeof val === 'object' && Buffer.isBuffer(val);

  /**
   * 格式化code，将srcCode和distCode转化为string
   * @param {PageInfo} page 待格式化的页面对象
   * @returns {PageInfo} 格式化之后的结果
   */
  formatCode = (page?: PageInfo): PageInfo => {
    const newPage: PageInfo = cloneDeep(page);
    if (this.isBuffer(page.distCode)) newPage.distCode = page.distCode.toString();
    if (this.isBuffer(page.srcCode)) newPage.srcCode = page.srcCode.toString();
    if (page.pageCreateTime) newPage.pageCreateTime = getFormatTime(page.pageCreateTime);
    if (page.pageModifyTime) newPage.pageModifyTime = getFormatTime(page.pageModifyTime);
    if (page.pagePublishTime) newPage.pagePublishTime = getFormatTime(page.pagePublishTime);
    return newPage;
  };

  /**
   * 更新页面信息
   * @param {PageInfo} page 待更新页面数组
   * @param {Boolean} isPublish 是否发布
   * @param {String} operator 操作人
   * @returns {Res} 结果返回
   */
  update = async (pages: PageInfo[], isPublish = false, operator = '') => {
    const sequelize = SequelizeHelper.getInstance();
    const pageColUpdate: PageInfo = {};
    if (!isPublish) {
      pageColUpdate.pagePublishStatus = PageStatus.MODIFYING;
      pageColUpdate.pageModifyTime = getFormatTime();
    } else {
      pageColUpdate.pagePublishStatus = PageStatus.PUBLISHED;
      pageColUpdate.pagePublishTime = getFormatTime();
      pageColUpdate.pagePublishOperator = operator;
    }
    try {
      await sequelize.transaction(() => {
        Promise.all(
          pages.map(async (page: PageInfo) => {
            // 如果page.id不是纯数字，说明是新建的页面，需要补入一些字段
            const isNewPage = !/^\d+$/.test(page.id);
            if (isNewPage) {
              pageColUpdate.pageCreateTime = getFormatTime();
              pageColUpdate.pageTitle = page.pageName;
            }
            const upsertPage = Object.assign(page, pageColUpdate) as Page;
            // page更新到数据库
            await Page.upsert(upsertPage);
            if (isNewPage) {
              // 将新分配的Pageid回写至srcCode,distCode
              const newPageIdRes = await Page.findOne({
                where: {
                  actId: page.actId,
                  pageTitle: page.pageTitle,
                },
                attributes: ['id'],
              });
              const newPageId = newPageIdRes.toJSON();
              await this.updateCode(newPageId.id, page);
            }
          }),
        );
      });
      return { ret: 0, msg: '页面配置更新成功' };
    } catch (e) {
      logger.error(`页面配置更新失败：${e}`);
      throw new Error('页面配置更新失败');
    }
  };

  /**
   * 查询页面
   * @param {number} actId 活动Id
   * @param {string[]} publishPages 待发布页面数组
   * @returns {PageInfo[]} 查询结果
   */
  getPages = async (actId: number, publishPages: string[]): Promise<PageInfo[]> => {
    SequelizeHelper.getInstance();
    const pages = await Page.findAll(
      publishPages.length > 0
        ? {
            where: {
              actId,
              pageName: publishPages,
            },
            raw: true,
          }
        : {
            where: {
              actId,
            },
            raw: true,
          },
    );

    return pages.map((page) => this.formatCode(page));
  };

  /**
   * 查询页面数量
   * @param {number} actId 活动Id
   * @returns {number} 页面数量
   */
  getPagesCount = async (actId: number): Promise<number> => {
    SequelizeHelper.getInstance();
    const pages = await Page.findAll({
      where: {
        actId,
      },
      raw: true,
    });
    return pages.length;
  };

  /**
   * 将新分配的Pageid回写至srcCode,distCode
   * @param {string} pageId 页面id
   * @param {PageInfo} page 页面配置
   * @returns void
   */
  updateCode = async (pageId: string, page: PageInfo) => {
    try {
      // 不是真正的json对象，可能包含组件自定义code代码
      // eslint-disable-next-line no-eval
      const srcCode = eval(`(${page.srcCode})`);
      srcCode.items[0].id = pageId;
      const newSrcCode = serializeConfig(srcCode);
      const newDistCode = configTransformDist(newSrcCode);
      await Page.update(
        {
          srcCode: newSrcCode,
          distCode: newDistCode,
        },
        {
          where: { id: pageId },
        },
      );
    } catch (error) {
      logger.error(error);
      throw new Error('保存新添加的页面失败');
    }
  };
}
