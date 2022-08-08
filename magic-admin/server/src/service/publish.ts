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

import { copySync, emptyDir, outputFileSync, readFileSync } from 'fs-extra';
import { cloneDeep } from 'lodash';

import { ActStatus, StaticPath, UiRuntimeJS } from '@src/config/config';
import ActService from '@src/service/act';
import PageService from '@src/service/page';
import type { ActBaseInfo, PageInfo, UiConfig } from '@src/typings';
import { configTransformDist, processTransConfig, serializeConfig } from '@src/utils/index';
import logger from '@src/utils/logger';

const actService = new ActService();
const pageService = new PageService();
type DivideConfig = {
  pageName: string;
  pageConfig: UiConfig;
};
type DivideConfigTrans = {
  pageName: string;
  pageConfigStr: string;
};

export default class PublishService {
  /**
   * 保存
   * @param {ActBaseInfo} actInfo 活动信息
   * @param {string} rootInfo uiconfig页面配置信息
   * @returns {Res} 保存结果
   */
  saveActInfo = async ({ actInfo, rootInfo }: { actInfo: ActBaseInfo; rootInfo: string }) => {
    // 保存活动基础信息
    await actService.update(actInfo);
    try {
      // 不是真正的json对象，可能包含组件自定义code代码
      // eslint-disable-next-line no-eval
      const uiConfig = eval(`(${rootInfo})`);
      // 按页面拆分 abtest等发布时处理
      const divideConfigs = dividePageProcessor(uiConfig);
      // 处理为保存所需格式
      const pagesForSave = pageSaveProcessor(divideConfigs, actInfo);
      // 保存到magic_ui_config表
      await pageService.update(pagesForSave);
      return { ret: 0, msg: '保存成功' };
    } catch (error) {
      logger.error(error);
      throw new Error('保存活动失败');
    }
  };

  /**
   * 发布
   * @param {number} actId 活动Id
   * @param {string[]} publishPages 待发布页面
   * @param {string} operator 发布人
   * @returns {Res} 发布结果
   */
  publish = async ({
    actId,
    publishPages,
    operator,
  }: {
    actId: number;
    publishPages: string[];
    rootInfo: string;
    operator: string;
  }) => {
    try {
      // 查询活动基础信息
      const actInfo = await actService.getActInfo(actId);
      // 查询需要发布的页面
      const pagesToPublish = await pageService.getPages(actId, publishPages);
      let publishPagesArr: DivideConfigTrans[] = pagesToPublish.map((pageItem) => ({
        pageName: pageItem.pageName,
        pageConfigStr: pageItem.distCode,
      }));
      // 处理abtest页面
      const abTestConfig: DivideConfigTrans[] = await getAbTestConfig(publishPages, actInfo.abTest, actId);
      publishPagesArr = publishPagesArr.concat(abTestConfig);
      // 发布
      await publishToFiles(publishPagesArr);
      // 更新页面状态
      await pageService.update(pagesToPublish, true, operator);
      // 确认页面是否全部发布
      let actStatus = ActStatus.PART_PUBLISHED;
      const singlePageCount = await pageService.getPagesCount(actId);
      const abTestCount = actInfo.abTest.length;
      const allPagesCount = singlePageCount + abTestCount;
      if (allPagesCount === publishPages.length) {
        actStatus = ActStatus.PUBLISHED;
      }
      await actService.publish(actInfo, actStatus);
      return { ret: 0, msg: '发布成功' };
    } catch (error) {
      logger.error(error);
      throw new Error('发布失败');
    }
  };
}

/**
 * 配置信息拆分
 * @param {UiConfig} uiConfig 按页面拆分后的配置数组，每个都是完整的uiconfig，可直接发布
 * @returns {DivideConfig[]} 拆分后的页面数组
 */
const dividePageProcessor = (uiConfig: UiConfig): DivideConfig[] => {
  const deployPages: DivideConfig[] = [];
  // 按页面拆分uiConfig
  for (let i = 0; i < uiConfig.items.length; i++) {
    // 深复制一份
    const pageConfig = cloneDeep(uiConfig);
    pageConfig.items = [pageConfig.items[i]];
    deployPages.push({
      pageName: uiConfig.items[i].name,
      pageConfig,
    });
  }
  return deployPages;
};

/**
 * 获取abtest包含的页面配置
 * @param {ActBaseInfo.abTest} abTest abtest配置
 * @param {string[]} publishPages 待发布页面
 * @param {number} actId 活动ID
 * @returns {DivideConfig[]} abtest拆分后的页面数组
 */
const getAbTestConfig = async (
  publishPages: string[],
  abTest: ActBaseInfo['abTest'],
  actId: number,
): Promise<DivideConfigTrans[]> => {
  const filterArr = filterIncludeAbTest(publishPages, abTest);
  if (filterArr.length === 0) {
    return [];
  }
  return await Promise.all(
    filterArr.map(async (test) => {
      let pagesToPublish: UiConfig;
      await Promise.all(
        test.pageList.map(async (testItem) => {
          const [pageRecord] = await pageService.getPages(actId, [testItem.pageName]);
          // 不是真正的json对象，可能包含组件自定义code代码
          // eslint-disable-next-line no-eval
          const pageConfig = eval(`(${pageRecord.distCode})`);
          if (!pagesToPublish) {
            pagesToPublish = pageConfig;
          } else {
            pagesToPublish.items.push(pageConfig?.items[0]);
          }
        }),
      );
      // 将config对象序列化并转译
      const srcCode = serializeConfig(pagesToPublish);
      const distCode = configTransformDist(srcCode);
      return {
        pageName: test.name,
        pageConfigStr: distCode,
      };
    }),
  );
};

/**
 * 过滤出发布页面包含的abtest页面
 * @param {ActBaseInfo.abTest} abTest abtest配置
 * @param {string[]} publishPages 待发布页面
 * @returns {ActBaseInfo['abTest']} 过滤结果
 */
const filterIncludeAbTest = (publishPages: string[], abTest: ActBaseInfo['abTest']) => {
  if (abTest.length === 0) {
    return [];
  }
  const filterArr = [];
  abTest.forEach((test) => {
    if (publishPages.includes(test.name)) {
      filterArr.push(test);
    }
  });
  return filterArr;
};

/**
 * 处理为保存所需格式
 * @param {DivideConfig[]} divideConfigs 按页面拆分后的配置数组，每个都是完整的uiconfig，可直接发布
 * @param {ActBaseInfo} actInfo 活动基本信息
 * @returns {PageInfo[]} 保存所需的PageInfo数组
 */
const pageSaveProcessor = (divideConfigs: DivideConfig[], actInfo: ActBaseInfo): PageInfo[] =>
  divideConfigs.map((divideItem) => {
    const srcCode = serializeConfig(divideItem.pageConfig);
    const distCode = configTransformDist(srcCode);
    return {
      pageTitle: divideItem.pageConfig.items[0].title || divideItem.pageConfig.items[0].name,
      pageName: divideItem.pageName,
      srcCode,
      distCode,
      actId: actInfo.actId,
      id: divideItem.pageConfig.items[0].id,
    };
  });

/**
 * 发布活动配置文件
 * @param {DivideConfigTrans} pageConfig 发布页面的UiConfig活动配置
 * @returns void
 */
const publishUiconfig = (pageConfig: DivideConfigTrans) => {
  try {
    const { pageName, pageConfigStr } = pageConfig;
    const distJs = `${StaticPath.PUBLISH}/uiconfig_${pageName}.js`;
    const code = processTransConfig(pageConfigStr);
    outputFileSync(distJs, code);
    logger.debug(`create ${distJs} success!`);
  } catch (error) {
    logger.error(error);
    throw new Error('发布活动配置文件失败');
  }
};
/**
 * 发布活动html文件
 * @param {DivideConfigTrans} pageConfig 发布页面的UiConfig活动配置
 * @returns void
 */
const publishHtml = (pageConfig: DivideConfigTrans) => {
  const { pageName } = pageConfig;
  try {
    // 复制html模板
    const distHtml = `${StaticPath.PUBLISH}/${pageName}.html`;
    const tmpHtml = `${StaticPath.STATIC}/vue3/runtime/page/index.html`;
    copySync(tmpHtml, distHtml);
    // 注入活动配置文件
    const configScript = `<script type='module' src='./uiconfig_${pageName}.js'></script>\n\t${UiRuntimeJS}`;
    const data = readFileSync(distHtml, 'utf-8');
    const newData = data.replace(UiRuntimeJS, configScript);
    outputFileSync(distHtml, newData, 'utf-8');
    logger.debug(`create ${distHtml} success!`);
  } catch (error) {
    throw new Error('发布活动html文件失败');
  }
};

/**
 * 发布文件
 * @param {DivideConfigTrans[]} publishPagesArr 每个发布页面的UiConfig
 * @returns void
 */
const publishToFiles = async (publishPagesArr: DivideConfigTrans[]) => {
  // 1. 文件夹清空并重新创建
  await emptyDir(StaticPath.PUBLISH);
  publishPagesArr.forEach((divideConfig) => {
    // 2、发布uiconfig.js
    publishUiconfig(divideConfig);
    // 3、发布html模板
    publishHtml(divideConfig);
  });
};
