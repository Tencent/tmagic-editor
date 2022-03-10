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

import { AllowNull, Column, HasMany, Model, Table } from 'sequelize-typescript';

import { Page } from '@src/models/page';
// 活动基础信息表
@Table({
  tableName: 'magic_act_info',
})
export class ActInfo extends Model<ActInfo> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
    field: 'act_id',
  })
  actId: number;

  @Column({ field: 'act_crypto_id' })
  actCryptoId: string;

  @Column({ field: 'act_name' })
  actName: string;

  @Column({ field: 'act_begin_time' })
  actBeginTime: string;

  @Column({ field: 'act_end_time' })
  actEndTime: string;

  @Column({ field: 'act_modify_time' })
  actModifyTime: string;

  @Column({ field: 'act_create_time' })
  actCreateTime: string;

  @AllowNull
  @Column
  operator?: string;

  @AllowNull
  @Column
  locker?: string;

  @Column({ field: 'lock_time' })
  lockTime: string;

  @AllowNull
  @Column({ field: 'act_status' })
  actStatus: number; // 0:修改中 1：部分已发布 2：已发布

  @HasMany(() => Page)
  pages: Page[];

  @AllowNull
  @Column({ field: 'abtest_raw' })
  abTestRaw?: string;
}
