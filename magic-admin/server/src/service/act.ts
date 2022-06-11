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
import { Op } from 'sequelize';

import { ActStatus } from '@src/config/config';
import { ActInfo } from '@src/models/act';
import { Page } from '@src/models/page';
import SequelizeHelper from '@src/sequelize/index';
import PageService from '@src/service/page';
import type { ABTest, ActBaseInfo, ActInfoIncludePage, PageInfo } from '@src/typings';
import Crypto from '@src/utils/crypto/crypto';
import { getFormatTime } from '@src/utils/index';
import logger from '@src/utils/logger';

export interface OrderItem {
  columnName: string;
  direction: string;
}

export interface ActListQuery {
  where: {
    onlySelf: boolean;
    search: string;
    pageTitle: string;
    actStatus: number;
  };
  orderBy: OrderItem[];
  pgIndex: number;
  pgSize: number;
  userName: string;
}

// 新建活动参数
export interface ActInfoDetail {
  actName: string;
  actBeginTime: string;
  actEndTime: string;
  operator: string;
}

// 复制活动参数
export interface CopyInfo {
  actId: number;
  userName: string;
}

export type FormatType = 'search' | 'actId' | 'status' | 'order' | 'title';

// 活动列表查询体的构建方法
const getActListQueryConstructor = ({ attributes = [], query }: { attributes?: string[]; query: ActListQuery }) => ({
  attributes: [...attributes],
  where: {
    operator: { [Op.substring]: query.where.onlySelf ? query.userName : '' },
    actStatus: formatQuery(query.where.actStatus, 'status'),
    [Op.or]: [
      { actName: { [Op.substring]: formatQuery(query.where.search, 'search') } },
      { operator: { [Op.substring]: formatQuery(query.where.search, 'search') } },
      { actCryptoId: query.where.search },
      formatQuery(query.where.search, 'actId'),
    ],
  },
});

export default class ActService {
  private pageService: PageService = new PageService();

  /**
   * 查询活动列表
   * @param {ActListQuery} query 查询语句
   * @returns {ActInfoIncludePage[]} 活动列表数据
   */
  getActList = async (query: ActListQuery) => {
    SequelizeHelper.getInstance();
    // 构建查询体
    const attributes = ['actId', 'actName', 'actBeginTime', 'actEndTime', 'actStatus', 'operator', 'actCryptoId'];
    const queryCond = getActListQueryConstructor({ attributes, query });
    const actList = await ActInfo.findAll({
      ...queryCond,
      order: formatQuery(query.orderBy[0], 'order'),
      limit: query.pgSize,
      offset: query.pgIndex * query.pgSize,
      include: [
        {
          model: Page,
          attributes: ['pageTitle', 'pagePublishTime', 'pagePublishStatus', 'pagePublishOperator'],
          where: formatQuery(query.where.pageTitle, 'title') as {
            pageTitle: {
              [Op.substring]: string;
            };
          } | null,
        },
      ],
    });

    const formatActList = actList.map((act) => this.formatPages(act));

    return formatActList;
  };

  /**
   * 获取查询结果总数
   * @param {ActListQuery} query 查询语句
   * @returns {number} 查询结果总数
   */
  getCount = async (query: ActListQuery) => {
    SequelizeHelper.getInstance();

    // 构建查询体
    const queryCond = getActListQueryConstructor({ query });
    const actList = await ActInfo.findAll({
      ...queryCond,
      include: [
        {
          model: Page,
          attributes: [],
          where: formatQuery(query.where.pageTitle, 'title'),
        },
      ],
    });

    return actList.length;
  };

  /**
   * 根据id查询活动详情
   * @param {number} actId 活动id
   * @returns {ActInfoIncludePage} 活动基本信息含页面配置
   */
  getActInfo = async (actId: number) => {
    const act = await getActInfoHandler(actId);
    const formatAct = this.formatPages(act);
    let abTestArray: ABTest[] = [];
    try {
      if (formatAct.abTestRaw) {
        abTestArray = JSON.parse(formatAct.abTestRaw);
      }
      formatAct.abTest = abTestArray;
      delete formatAct.abTestRaw;
      return formatAct;
    } catch (error) {
      logger.error(error);
      throw new Error('根据id查询活动详情失败');
    }
  };

  /**
   * 新建活动
   * @param {ActInfoDetail} actInfo 新建活动所需信息
   * @returns {number} 活动id
   */
  create = async (actInfo: ActInfoDetail) => {
    SequelizeHelper.getInstance();

    // 新增活动
    const newAct = {
      actModifyTime: getFormatTime(),
      actCreateTime: getFormatTime(),
      actStatus: ActStatus.MODIFYING,
      actCryptoId: '', // 数据库不能为空，先做个占位符
      ...actInfo,
    };
    const act = await ActInfo.create<ActInfo>(newAct as ActInfo);

    // 更新加密id
    const cryptoId = Crypto.encode(act.actId.toString());
    await ActInfo.update(
      { actCryptoId: cryptoId },
      {
        where: { actId: act.actId },
      },
    );

    // 添加默认活动页
    const defaultPage = await this.pageService.create({
      actId: act.actId,
    });
    await act.$add<Page>('Pages', defaultPage);

    return act.actId;
  };

  /**
   * 复制活动
   * @param {CopyInfo} copyInfo 复制活动所需信息
   * @returns void
   */
  copy = async (copyInfo: CopyInfo) => {
    SequelizeHelper.getInstance();

    const targetAct = await ActInfo.findOne({
      where: { actId: copyInfo.actId },
      include: Page,
    });

    if (!targetAct) throw new Error('源活动不存在');

    const { actName, actBeginTime, actEndTime } = targetAct;
    const newAct = {
      actName: `【复制】${actName}`,
      actBeginTime,
      actEndTime,
      actModifyTime: getFormatTime(),
      actCreateTime: getFormatTime(),
      operator: copyInfo.userName,
      actStatus: ActStatus.MODIFYING,
    };

    const act = await ActInfo.create<ActInfo>(newAct as ActInfo);

    // 更新加密id
    const cryptoId = Crypto.encode(act.actId.toString());
    await ActInfo.update(
      { actCryptoId: cryptoId },
      {
        where: { actId: act.actId },
      },
    );

    // 复制page
    if (targetAct.pages) {
      await Promise.all(
        targetAct.pages.map(async (page) => {
          const copyPage = await this.pageService.create(page);
          await act.$add<Page>('Pages', copyPage);
        }),
      );
    }
  };

  /**
   * 更新活动信息
   * @param {ActBaseInfo} actInfo 需要更新的活动信息
   * @returns {Res} 活动基本信息
   */
  update = async (actInfo: ActBaseInfo) => {
    try {
      if (actInfo.abTest?.length) {
        actInfo.abTestRaw = JSON.stringify(actInfo.abTest);
      }
      SequelizeHelper.getInstance();
      const updateActInfo = Object.assign(actInfo, {
        actModifyTime: getFormatTime(),
        actStatus: ActStatus.MODIFYING,
      });

      await ActInfo.update(
        {
          ...updateActInfo,
        },
        {
          where: { actId: actInfo.actId },
        },
      );
    } catch (error) {
      logger.error(`活动基础信息保存失败：${error}`);
      throw new Error('活动基础信息保存失败');
    }
    return { ret: 0, msg: '活动基础信息保存成功' };
  };

  /**
   * 发布活动信息
   * @param {ActBaseInfo} actInfo 需要发布的活动信息
   * @param {number} actStatus 活动状态
   * @returns {Res} 活动基本信息
   */
  publish = async (actInfo: ActBaseInfo, actStatus: number) => {
    try {
      const updateActInfo = Object.assign(actInfo, {
        actModifyTime: getFormatTime(),
        actStatus,
      });
      await ActInfo.update(
        {
          ...updateActInfo,
        },
        {
          where: { actId: actInfo.actId },
        },
      );
    } catch (error) {
      logger.error(`活动基础信息发布失败：${error}`);
      throw new Error('活动基础信息发布失败');
    }
    return { ret: 0, msg: '活动基础信息发布成功' };
  };

  /**
   * 根据页面ID删除活动页面
   * @param {number} pageId 页面ID
   * @returns void
   */
  removePage = async (pageId: number) => {
    try {
      await Page.destroy({
        where: {
          id: pageId,
        },
      });
    } catch (error) {
      logger.error(error);
      throw new Error('删除活动页面失败');
    }
  };

  /**
   * 格式化pages的code
   * @param {ActInfo} act 待格式化内容
   * @returns {ActInfo} 格式化之后的结果
   */
  formatPages = (act: ActInfoIncludePage): ActInfoIncludePage => {
    const newAct: ActInfoIncludePage = cloneDeep(act);
    if (act.pages) {
      newAct.pages = act.pages.map((page: PageInfo) => this.pageService.formatCode(page));
    }
    return newAct;
  };
}

/**
 * 按活动号查询，关联page数据
 * @param {number} actId 活动id
 * @returns {ActInfoIncludePage} 查询结果
 */
const getActInfoHandler = async (actId: number): Promise<ActInfoIncludePage> => {
  SequelizeHelper.getInstance();
  const act = await ActInfo.findOne({
    where: { actId },
    include: Page,
  });
  if (!act) throw new Error('活动不存在');
  return act.toJSON() as ActInfoIncludePage;
};

// 将原始查询参数转化为构建查询体的参数
const formatSearch = (search: string) => search || '';

const formatActIdQuery = (search: string) => {
  const isNumber = search && !isNaN(parseInt(search, 10));
  return isNumber ? { actId: parseInt(search, 10) } : {};
};

const formatActStatusQuery = (status: number) =>
  status === ActStatus.ALL ? { [Op.in]: [ActStatus.MODIFYING, ActStatus.PART_PUBLISHED, ActStatus.PUBLISHED] } : status;

const formatOrder = (order: OrderItem) =>
  order.columnName ? [[order.columnName, order.direction === 'descending' ? 'DESC' : 'ASC']] : [];

const formatPageTitle = (title: string) =>
  title
    ? {
        pageTitle: { [Op.substring]: title },
      }
    : null;

// 根据查询参数类型返回对应的转化结果
const formatQuery = (query: string | OrderItem | number, type: FormatType) => {
  const formats = {
    search: formatSearch,
    actId: formatActIdQuery,
    status: formatActStatusQuery,
    order: formatOrder,
    title: formatPageTitle,
  };
  return formats[type]?.call(this, query);
};
