# FlowState

`FlowState` 是 `@tmagic/core` 的流程状态类，用于控制事件动作流程的执行。

## 构造函数

```typescript
new FlowState()
```

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `isAbort` | `boolean` | 当前流程是否已中止 |

## 实例方法

### abort

- **返回：**
  - `{void}`

- **详情：**

  中止当前流程。调用后 `isAbort` 变为 `true`，后续的事件动作将不再执行。

- **示例：**

```typescript
import { FlowState } from '@tmagic/core';

const flowState = new FlowState();

// 在某个条件下中止流程
if (shouldStop) {
  flowState.abort();
}

// 检查是否已中止
if (flowState.isAbort) {
  console.log('流程已中止');
}
```

### reset

- **返回：**
  - `{void}`

- **详情：**

  重置流程状态，将 `isAbort` 恢复为 `false`。

- **示例：**

```typescript
flowState.reset();
console.log(flowState.isAbort); // false
```

## 使用场景

FlowState 常用于控制事件动作链的执行流程：

```typescript
import App, { FlowState } from '@tmagic/core';

const app = new App({ /* options */ });

// 创建流程状态
const flowState = new FlowState();

// 执行代码块时传入流程状态
await app.runCode('validateCode', {}, [], flowState);

// 如果验证失败，代码块内部可以调用 flowState.abort()
// 后续的动作将不会执行
if (!flowState.isAbort) {
  await app.runCode('submitCode', {}, [], flowState);
}
```
