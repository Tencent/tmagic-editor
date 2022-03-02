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

import { Sequelize } from 'sequelize-typescript';

import sqlConf from '@src/config/database';
import models from '@src/models/index';
// 数据库初始化
export default class SequelizeHelper {
  private static instance;
  public static getInstance() {
    if (!SequelizeHelper.instance) {
      const sequelize = new Sequelize(sqlConf.database, sqlConf.user, sqlConf.password, {
        host: sqlConf.host,
        port: sqlConf.port,
        dialect: 'mysql',
        define: {
          timestamps: false,
        },
      });
      sequelize.addModels(models);
      SequelizeHelper.instance = sequelize;
    }
    return SequelizeHelper.instance;
  }
}
