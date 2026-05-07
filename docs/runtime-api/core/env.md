# Env

`Env` 是 `@tmagic/core` 的环境检测类，用于检测当前运行环境的设备和系统信息。

## 构造函数

```typescript
new Env(ua?: string, options?: Record<string, boolean | string>)
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `ua` | `string` | User Agent 字符串（可选，默认使用 `globalThis.navigator?.userAgent`） |
| `options` | `Record<string, boolean \| string>` | 额外的环境字段（可选）。构造时会通过 `Object.entries` 写入到实例上，可用于扩展自定义环境标记。**注意**：构造函数在 `ua` 为空（包括 `''`、`undefined` 等 falsy 值）时会**提前返回**，此时 `options` 同样**不会**被应用 |

## 属性

所有属性均为可赋值的公共字段（非只读），默认布尔值为 `false`：

| 属性 | 类型 | 说明 |
|------|------|------|
| `isIos` | `boolean` | 是否为 iOS 系统 |
| `isIphone` | `boolean` | 是否为 iPhone 设备 |
| `isIpad` | `boolean` | 是否为 iPad 设备 |
| `isAndroid` | `boolean` | 是否为 Android 系统 |
| `isAndroidPad` | `boolean` | 是否为 Android 平板 |
| `isMac` | `boolean` | 是否为 Mac 系统 |
| `isWin` | `boolean` | 是否为 Windows 系统 |
| `isMqq` | `boolean` | 是否在手机 QQ 中 |
| `isWechat` | `boolean` | 是否在微信中 |
| `isWeb` | `boolean` | 是否为 Web 环境 |
| `isOpenHarmony` | `boolean` | 是否为鸿蒙系统 |

`Env` 上还允许通过索引签名 `[x: string]: any` 写入自定义字段。

## 使用示例

```typescript
import { Env } from '@tmagic/core';

// 使用当前浏览器的 UA
const env = new Env();

if (env.isIos) {
  console.log('当前是 iOS 设备');
}

if (env.isWechat) {
  console.log('在微信中打开');
}

// 使用自定义 UA
const customEnv = new Env('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
console.log(customEnv.isIphone); // true

// 通过 options 注入自定义环境标记
const customEnv2 = new Env(navigator.userAgent, { isMiniProgram: true });
console.log(customEnv2.isMiniProgram); // true
```

## 在 App 中使用

```typescript
import App from '@tmagic/core';

const app = new App({
  ua: navigator.userAgent
});

// 通过 app.env 访问环境信息
if (app.env.isAndroid) {
  // Android 特定逻辑
}
```
