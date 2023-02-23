/**
 * 响应式命名空间
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Reactive {
  interface IDependency {
    add(fn: any): void;
    notify(newValue: any, oldValue: any): void;
  }
  /**
   * 通过对象引用收集依赖
   */
  const targetMap = new WeakMap<object, Map<string, IDependency>>();
  /**
   * 正在绑定的响应函数
   */
  let activeReactiveFn: any = undefined;
  /**
   * 响应式依赖对象
   */
  class Dependency implements IDependency {
    // 响应式函数数组
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _fns: Set<any> = new Set();
    // 添加响应式函数
    add(fn: any) {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { _fns } = this;
      _fns.add(fn);
    }
    // 触发响应式函数
    notify(newValue: any, oldValue: any) {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { _fns } = this;
      for (const fn of _fns) {
        fn(newValue, oldValue);
      }
    }
    // 解析依赖对象
    // eslint-disable-next-line @typescript-eslint/member-ordering
    static resolve<T extends object>(target: T, property: string): IDependency {
      if (!targetMap.has(target)) targetMap.set(target, new Map<string, IDependency>());
      const dependencyMap = targetMap.get(target) as Map<string, IDependency>;
      if (!dependencyMap.has(property)) dependencyMap.set(property, new Dependency());
      const dependency = dependencyMap.get(property) as IDependency;
      return dependency;
    }
  }
  /**
   * 创建一个可观测的对象，通过数据劫持的方式，进行响应式依赖收集
   * @param target
   * @returns
   */
  export function observable<T extends object>(target: T) {
    const proxy = new Proxy(target, {
      get(target, property: string, receiver) {
        const dependency = Dependency.resolve(target, property);
        // 依赖收集
        activeReactiveFn && dependency.add(activeReactiveFn);

        return Reflect.get(target, property, receiver);
      },
      set(target, property: string, newValue, receiver) {
        const oldValue = Reflect.get(target, property, receiver);
        const result = Reflect.set(target, property, newValue, receiver);
        // 触发响应式执行
        Dependency.resolve(target, property)?.notify(newValue, oldValue);

        return result;
      },
    });
    return proxy;
  }

  /**
   * 绑定响应函数
   * @param target
   * @param fn
   */
  export function reaction(watch: () => any, fn: (newValue: any) => void) {
    activeReactiveFn = fn;
    watch();
    activeReactiveFn = undefined;
  }
}
