# 观察者数据类

`@tmagic/data-source` 提供了三种观察者数据类，用于实现数据的响应式监听。

## ObservedData（抽象类）

所有观察者数据类的抽象基类，定义了统一的接口。

### 抽象方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `update` | `(data: any, path?: string)` | `void` | 更新数据 |
| `on` | `(path: string, callback: Function, options?: { immediate?: boolean })` | `void` | 监听数据变化 |
| `off` | `(path: string, callback: Function)` | `void` | 取消监听 |
| `getData` | `(path: string)` | `any` | 获取指定路径的数据 |
| `destroy` | `()` | `void` | 销毁 |

## SimpleObservedData

基于 EventEmitter 的简单观察者实现，只支持单层路径监听。

### 使用示例

```typescript
import { SimpleObservedData } from '@tmagic/data-source';

const observed = new SimpleObservedData({ name: 'test' });

// 监听数据变化
observed.on('name', (newVal) => {
  console.log('name 变更为:', newVal);
});

// 更新数据
observed.update({ name: 'new name' });

// 更新特定路径
observed.update('another name', 'name');

// 获取数据
const name = observed.getData('name');

// 取消监听
observed.off('name', callback);

// 销毁
observed.destroy();
```

### 特点

- 轻量级实现
- 只支持单层路径监听（如 `'name'`，不支持 `'user.name'`）
- 适用于简单数据结构

## DeepObservedData

基于 `deep-state-observer` 的深度观察者实现，支持深层路径监听。

### 使用示例

```typescript
import { DeepObservedData } from '@tmagic/data-source';

const observed = new DeepObservedData({
  user: {
    name: 'test',
    profile: {
      avatar: 'url'
    }
  }
});

// 监听深层路径
observed.on('user.profile.avatar', (newVal) => {
  console.log('头像变更为:', newVal);
});

// 监听整个对象
observed.on('user', (newVal) => {
  console.log('user 对象变更:', newVal);
});

// 立即执行回调
observed.on('user.name', callback, { immediate: true });

// 更新深层数据
observed.update('new avatar', 'user.profile.avatar');

// 获取深层数据
const avatar = observed.getData('user.profile.avatar');
```

### 特点

- 支持深层路径监听（如 `'user.profile.avatar'`）
- 支持 `immediate` 选项立即执行回调
- 适用于复杂嵌套数据结构
- 性能更优，只在相关路径变化时触发回调

## 在 DataSourceManager 中注册

可以通过静态方法注册自定义的观察者数据类：

```typescript
import { DataSourceManager, DeepObservedData } from '@tmagic/data-source';

// 注册深度观察者类
DataSourceManager.registerObservedData(DeepObservedData);
```

## 自定义观察者类

可以继承 `ObservedData` 实现自定义的观察者类：

```typescript
import { ObservedData } from '@tmagic/data-source';

class CustomObservedData extends ObservedData {
  private data: any;
  
  constructor(data: any) {
    super();
    this.data = data;
  }
  
  update(data: any, path?: string): void {
    // 自定义更新逻辑
  }
  
  on(path: string, callback: Function, options?: { immediate?: boolean }): void {
    // 自定义监听逻辑
  }
  
  off(path: string, callback: Function): void {
    // 自定义取消监听逻辑
  }
  
  getData(path: string): any {
    // 自定义获取数据逻辑
  }
  
  destroy(): void {
    // 自定义销毁逻辑
  }
}
```
