/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
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

import { EventEmitter } from 'events';

const methodName = (prefix: string, name: string) => `${prefix}${name[0].toUpperCase()}${name.substring(1)}`;

const isError = (error: any): boolean => Object.prototype.toString.call(error) === '[object Error]';

const doAction = (args: any[], scope: any, sourceMethod: any, beforeMethodName: string, afterMethodName: string) => {
  let beforeArgs = args;

  for (const beforeMethod of scope.pluginOptionsList[beforeMethodName]) {
    beforeArgs = beforeMethod(...beforeArgs) || [];

    if (isError(beforeArgs)) throw beforeArgs;

    if (!Array.isArray(beforeArgs)) {
      beforeArgs = [beforeArgs];
    }
  }

  let returnValue: any = sourceMethod.apply(scope, beforeArgs);

  for (const afterMethod of scope.pluginOptionsList[afterMethodName]) {
    returnValue = afterMethod(returnValue, ...beforeArgs);

    if (isError(returnValue)) throw returnValue;
  }

  return returnValue;
};

const doAsyncAction = async (
  args: any[],
  scope: any,
  sourceMethod: any,
  beforeMethodName: string,
  afterMethodName: string,
) => {
  let beforeArgs = args;

  for (const beforeMethod of scope.pluginOptionsList[beforeMethodName]) {
    beforeArgs = (await beforeMethod(...beforeArgs)) || [];

    if (isError(beforeArgs)) throw beforeArgs;

    if (!Array.isArray(beforeArgs)) {
      beforeArgs = [beforeArgs];
    }
  }

  let returnValue: any = await sourceMethod.apply(scope, beforeArgs);

  for (const afterMethod of scope.pluginOptionsList[afterMethodName]) {
    returnValue = await afterMethod(returnValue, ...beforeArgs);

    if (isError(returnValue)) throw returnValue;
  }

  return returnValue;
};

/**
 * 对Class进行扩展
 * 给Class中的每个方法都添加before after两个钩子
 * 给Class添加一个usePlugin方法，usePlugin方法可以传入一个包含before或者after方法的对象
 *
 * 例如：
 *   Class EditorService extends BaseService {
 *     constructor() {
 *       super([ { name: 'add', isAsync: true },]);
 *     }
 *     add(value) { return result; }
 *   };
 *
 *   const editorService = new EditorService();
 *
 *   editorService.usePlugin({
 *     beforeAdd(value) { return [value] },
 *     afterAdd(result, value) { return result },
 *   });
 *
 *   editorService.add(); 最终会变成  () => {
 *    editorService.beforeAdd();
 *    editorService.add();
 *    editorService.afterAdd();
 *   }
 *
 * 调用时的参数会透传到before方法的参数中, 然后before的return 会作为原方法的参数和after的参数，after第一个参数则是原方法的return值;
 * 如需终止后续方法调用可以return new Error();
 */
class BaseService extends EventEmitter {
  private pluginOptionsList: Record<string, Function[]> = {};
  private taskList: (() => Promise<void>)[] = [];
  private doingTask = false;

  constructor(methods: { name: string; isAsync: boolean }[] = [], serialMethods: string[] = []) {
    super();

    methods.forEach(({ name: propertyName, isAsync }) => {
      const scope = this as any;

      const sourceMethod = scope[propertyName];

      const beforeMethodName = methodName('before', propertyName);
      const afterMethodName = methodName('after', propertyName);

      this.pluginOptionsList[beforeMethodName] = [];
      this.pluginOptionsList[afterMethodName] = [];

      Object.defineProperty(scope, propertyName, {
        value: isAsync
          ? async (...args: any[]) => {
              if (!serialMethods.includes(propertyName)) {
                return doAsyncAction(args, scope, sourceMethod, beforeMethodName, afterMethodName);
              }

              // 由于async await，所以会出现函数执行到await时让出线程，导致执行顺序出错，例如调用了select(1) -> update -> select(2)，这个时候就有可能出现update了2；
              // 这里保证函数调用严格按顺序执行；
              const promise = new Promise<any>((resolve, reject) => {
                this.taskList.push(async () => {
                  try {
                    const value = await doAsyncAction(args, scope, sourceMethod, beforeMethodName, afterMethodName);
                    resolve(value);
                  } catch (e) {
                    reject(e);
                  }
                });
              });

              if (!this.doingTask) {
                this.doTask();
              }

              return promise;
            }
          : (...args: any[]) => doAction(args, scope, sourceMethod, beforeMethodName, afterMethodName),
      });
    });
  }

  public usePlugin(options: Record<string, Function>) {
    for (const [methodName, method] of Object.entries(options)) {
      if (typeof method === 'function' && !this.pluginOptionsList[methodName].includes(method)) {
        this.pluginOptionsList[methodName].push(method);
      }
    }
  }

  public removePlugin(options: Record<string, Function>) {
    for (const [methodName, method] of Object.entries(options)) {
      if (Array.isArray(this.pluginOptionsList[methodName])) {
        this.pluginOptionsList[methodName] = this.pluginOptionsList[methodName].filter((item) => item !== method);
      }
    }
  }

  public removeAllPlugins() {
    for (const key of Object.keys(this.pluginOptionsList)) {
      this.pluginOptionsList[key] = [];
    }
  }

  private async doTask() {
    this.doingTask = true;
    let task = this.taskList.shift();
    while (task) {
      await task();
      task = this.taskList.shift();
    }
    this.doingTask = false;
  }
}

export default BaseService;
