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

export type MagicStoreType = ActInfo | PageInfo[] | UiConfig;

// 全局通用store
export interface MagicStore {
  // 活动基础信息
  actInfo: ActInfo | {};
  // 页面信息及组件配置内容
  pages: PageInfo[];
  // 完整活动配置
  uiConfigs: UiConfig | {};
  // 编辑器默认选中节点ID
  editorDefaultSelected: string | number;
}

// 表单项配置
export interface FormRuleItem {
  required?: boolean;
  message?: string;
  trigger?: string;
  validator?: (args: any, data: any) => void;
}

// 表单配置
export interface FormConfigItem {
  name?: string;
  names?: string[];
  items?: FormConfigItem[];
  text?: string;
  placeholder?: string;
  inputType?: string;
  rules?: FormRuleItem[];
  type?: string;
}

// 活动基础信息定义
export interface ActInfo {
  /** 活动id */
  actId: number;
  /** 活动加密id */
  actCryptoId: string;
  /** 活动名称 */
  actName: string;
  /** 活动开始时间 */
  actBeginTime?: string;
  /** 活动结束时间 */
  actEndTime?: string;
  /** 活动修改时间 */
  actModifyTime?: string;
  /** 活动创建时间 */
  actCreateTime?: string;
  /** 操作人 */
  operator: string;
  /** 锁定人（预留） */
  locker?: string;
  /** 锁定时间（预留） */
  lockTime?: string;
  /** 活动状态：0:修改中 1：部分已发布 2：已发布 */
  actStatus: int;
  /** abtest配置 */
  abTest?: abTest[];
}

// 活动页面信息定义
export interface PageInfo {
  actId?: number;
  id: number;
  pageTitle: string;
  pageName: string;
  pageCreateTime?: string;
  pageModifyTime?: string;
  pagePublishStatus?: number;
  pagePublishTime?: string;
  pagePublishOperator?: string;
  pagePublishUiVersion?: string;
  srcCode?: any;
  distCode?: string;
  plugins?: string[];
  items?: [];
  type?: string;
  title?: string;
  name?: string;
}

// 编辑器组件配置定义
export interface UiConfig {
  actId: number;
  type: string;
  id?: string;
  name?: string;
  operator?: string;
  items?: PageInfo[];
  abTest?: ABTest[];
  useLastPackage?: string;
}

// 活动页面abtest定义
export interface ABTest {
  name: string;
  type: string;
  pageList?: ABTestPageList[];
}

// 活动页面abtest pagelist定义
export interface ABTestPageList {
  pageTitle: string;
  proportion: string;
}

// 从editor拿到的活动页面信息
export interface EditorInfo {
  type: string;
  items: PageInfo[];
  id?: number | string;
  name?: string;
}
// 新建活动的初始值类型
export interface ActFormValue {
  operator: string;
  actBeginTime: string;
  actEndTime: string;
}
// 侧边栏配置
export interface AsideState {
  data: {
    id: number;
    url: string;
    icon: string;
    text: string;
    items?: {
      id: number;
      url: string;
      icon: string;
      text: string;
    }[];
  }[];
  collapse: boolean;
}
// m-table表格栏配置项
export interface ColumnItem {
  prop: string;
  label?: string;
  width?: string;
  sortable?: string;
  action?: string;
  formatter?: (v: string | number, row?: ActListItem) => string;
  type?: ((v: string | number, row?: ActListItem) => string) | string;
  handler?: (row?: ActListItem) => void | Promise<void>;
  showHeader?: boolean;
  table?: ColumnItem[];
  fixed?: string;
  actions?: ActionItem[];
}
// 表格项操作
export interface ActionItem {
  text: string;
  handler?: (row: ActListItem) => void;
  type?: string;
  after?: () => void;
  display?: (v?: string, row?: ActListItem) => boolean;
}
