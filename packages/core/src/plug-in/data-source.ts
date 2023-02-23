/* eslint-disable camelcase */
/* eslint-disable no-useless-constructor */
// eslint-disable-next-line max-classes-per-file
import { EventEmitter } from 'events';

import axios from 'axios';
import { get, template as lodashTemplate, values } from 'lodash-es';

/**
 * 结果类型，如果结果类型为 【list】返回的是 ListData 结果，如果结果类型为 【table】返回的是 TableData 结果
 */
export type ResultType = 'list' | 'table';

/**
 * 列表数据
 */
export type ListData = {
  [key: string]: string | number;
};

/**
 * 表格数据
 */
export type TableData = {
  [key: string]: Array<string | number>;
};

/**
 * 数据源配置模式
 */
export interface DataSourceSchema {
  /**
   * Id
   */
  id: string | number;
  /**
   * 数据源名称
   */
  name?: string;
  /**
   * 结果类型 list、table
   */
  rtype: ResultType;
  /**
   * KEYS
   */
  keys: Array<string>;
  /**
   * 别名
   */
  alias: Array<{ key: string; name: string }>;
  /**
   * 其他自定义属性
   */
  [property: string]: any;
}
/**
 * Http数据源配置模式
 */
export interface HttpDataSourceSchema extends DataSourceSchema {
  /**
   * 请求地址
   */
  url: string;
  /**
   * 请求方法
   * @default 'get'
   */
  method?: 'get' | 'post';
  /**
   * 请求头部，默认值为 空
   */
  headers?: {
    [name: string]: string | number;
  };
  /**
   * 查询参数
   */
  params?: {
    [name: string]: string | number;
  };
  /**
   * 查询body
   */
  body?: string | object;
  /**
   * 数据格式转换，其中kvp为默认转化格式，string类型是js converter（框架会处理安全问题）
   */
  mode?: 'kvp' | string;
  /**
   * 数据更新间隔，单位秒。默认值30s
   */
  interval?: number;
}

/**
 * 取消事件回调（调用时，恢复到前一个状态）
 */
export type CancelEventCallback = () => void;

/**
 * 数据集设置
 */
export interface DataSetOptions {
  /**
   * 自动启动数据源，默认值true
   */
  autostart?: boolean;
  /**
   * 适配器（响应式对象包装函数）
   */
  adapter?: Function;
}

/**
 * 数据集
 */
export class DataSet {
  /**
   * 数据源Map
   */
  #sources = new Map<string | number, DataSource>();

  // 默认值
  #default: DataSetOptions = {
    autostart: true,
  };

  /**
   * 选项值
   */
  #options: DataSetOptions;

  /**
   *
   */
  constructor(schemas: DataSourceSchema | Array<DataSourceSchema>, options?: DataSetOptions) {
    this.#options = { ...this.#default, ...options };
    const { autostart } = this.#options;
    const $schemas = Array.isArray(schemas) ? schemas : [schemas];
    $schemas.forEach((schema) => {
      const dataSource = this.factory(schema);
      this.#sources.set(schema.id, dataSource);
      // 启动数据源
      autostart && dataSource.start();
    });
  }

  /**
   * 获取数据源列表
   */
  get sources(): Array<DataSource> {
    return Array.from(this.#sources.values());
  }

  /**
   * 获取数据集选项
   */
  get options() {
    return this.#options;
  }

  /**
   * 工厂方法，通过DataSourceSchema创建数据源对象
   * @param schema DataSourceSchema 数据源描述
   * @returns DataSource 数据源对象
   */
  factory(schema: DataSourceSchema & { [name: string]: any }): DataSource {
    const { adapter } = this.options;
    if (schema.url) {
      return new HttpDataSource(schema as HttpDataSourceSchema, adapter);
    }
    throw new Error('不受支持的DataSourceSchema');
  }

  /**
   * 读取数据源的值
   * @param id 数据源id
   * @param key KEY
   * @returns
   */
  value(
    id: string | number,
    key: string | Array<string> | { [name: string]: string }, // | Array<{ key: string; bindName: string }>
    template?: string,
  ): any {
    if (!this.#sources.has(id)) return undefined;
    const result = this.#sources.get(id)?.data || {};
    if (typeof key === 'string') {
      const property = key;
      const val = get(result, property);
      const compiled = template && lodashTemplate(template);
      // console.log(template);
      if (compiled) {
        return compiled({ [property]: val });
      }
      return val;
    }
    // 特殊兼容语法，该模式任然需要思考
    if (Array.isArray(key)) {
      const result2 = key.reduce<{ [key: string]: any }>((merge, key: string) => {
        const property = key;
        merge[property] = get(result, property);
        return merge;
      }, {});
      const compiled = template && lodashTemplate(template);
      // console.log(template);
      if (compiled) {
        return compiled(result2);
      }
      return result2;
    }

    const map = key;
    const result2 = Object.keys(map).reduce<{ [key: string]: any }>((merge, property) => {
      merge[property] = get(result, property);
      return merge;
    }, {});
    const compiled = template && lodashTemplate(template);
    if (compiled) {
      return compiled(result2);
    }
    return result2;
  }

  /**
   * 销毁数据集
   */
  async destroy(): Promise<void> {
    const temp: Array<Promise<void>> = [];
    for (const [, ds] of this.#sources) {
      temp.push(ds.destroy());
    }
    // 等待所有对象销毁
    await Promise.all(temp);
    this.#sources.clear();
  }
}

/**
 * 数据源抽象类
 */
export abstract class DataSource extends EventEmitter {
  #id: string | number;

  #schema: DataSourceSchema;

  #name: string;

  // #data: { [key: string]: any } = Reactive.observable({}); // 创建响应式对象
  #data: { [key: string]: any };

  #keys: Array<string>;

  #alias: Array<{ key: string; name: string }>;

  #rtype: ResultType;

  /**
   *
   */
  constructor(schema: DataSourceSchema, adapter?: Function) {
    super();
    this.#id = schema.id;
    this.#name = schema.name || '未知数据源';
    this.#keys = schema.keys;
    this.#alias = schema.alias;
    this.#rtype = schema.rtype;
    this.#schema = schema;
    const data = schema.keys
      .concat(schema.alias.map((p) => p.name))
      .reduce((t, key) => Object.assign(t, { [key]: '' }), {});
    if (typeof adapter === 'function') this.#data = adapter(data);
    else this.#data = data;
  }

  /**
   * 数据源Id
   */
  get id() {
    return this.#id;
  }

  /**
   * 数据源名称
   */
  get name() {
    return this.#name;
  }

  /**
   * 键数
   */
  get keys() {
    return this.#keys;
  }

  /**
   * 别名
   */
  get alias() {
    return this.#alias;
  }

  get rtype() {
    return this.#rtype;
  }

  /**
   * 数据源描述
   */
  get schema() {
    return this.#schema;
  }

  /**
   * 数据源数据，key-value格式
   */
  get data() {
    return this.#data;
  }

  /**
   * 设置数据源数据
   * @fires DataSource#change
   */
  set data(val: { [key: string]: any }) {
    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (const key in val) {
      this.#data[key] = val[key];
    }
    this.onChange(val);
  }

  /**
   * 触发change事件
   * @param data 事件数据
   * @fires DataSource#change
   */
  onChange(data: { [key: string]: any }) {
    this.emit('change', data, this.#data);
  }

  /**
   * 销毁数据源
   */
  abstract destroy(): Promise<void>;

  /**
   * 启动数据源
   */
  abstract start(): CancelEventCallback;

  /**
   * 更新数据源
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  update(): Promise<void> {
    return Promise.resolve();
  }
}

/**
 * http数据源
 */
export class HttpDataSource extends DataSource {
  #schema: HttpDataSourceSchema;

  #timer?: NodeJS.Timer;

  #spec: string;

  start(): CancelEventCallback {
    if (this.#timer) {
      clearInterval(this.#timer);
    }
    // 立即执行一次
    this.request();

    const { interval = 30 } = this.#schema;
    this.#timer = setInterval(this.request.bind(this), interval * 1000);
    // 返回一个取消函数
    return () => {
      this.#timer && clearInterval(this.#timer);
      this.#timer = undefined;
    };
  }

  update(): Promise<void> {
    return this.request();
  }

  /**
   * 构造函数
   * @param {HttpDataSourceSchema} schema 配置
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  constructor(schema: HttpDataSourceSchema, adapter?: Function) {
    super(schema, adapter);
    this.#spec = schema.spec;
    this.#schema = schema;
  }

  /**
   * 数据规格
   */
  get spec() {
    return this.#spec;
  }

  async request() {
    const { url, headers, params, body, method = 'get' } = this.#schema;
    const req = await axios({
      url,
      method,
      headers,
      params,
      data: body,
    });
    const data = this.processing(req.data);
    this.data = data;
  }

  processing(result: any): { [name: string]: any } {
    const { mode = 'kvp', rtype, keys, alias } = this.#schema;
    // rtype 暂时不使用
    const temp: { [name: string]: any } = {};
    if (/kvp/i.test(mode)) {
      keys.forEach((key) => {
        temp[key] = get(result, key);
      });
      alias.forEach(({ key, name }) => {
        temp[name] = temp[key];
      });
    } else if (mode) {
      // mode js converter

      // eslint-disable-next-line no-eval
      const func = eval(mode);
      const temp2 = func?.(result);
      Object.assign(temp, temp2);
    }
    // 结果数据验证
    if (rtype === 'table') {
      if (!values(temp).every((p) => Array.isArray(p))) throw new Error('错误的返回数据格式');
    }
    return temp;
  }

  async destroy(): Promise<void> {
    this.removeAllListeners();
    this.#timer && clearInterval(this.#timer);
    this.#timer = undefined;
  }
}

export default DataSet;
