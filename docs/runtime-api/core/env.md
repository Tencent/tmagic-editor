# Env

`Env` 是 `@tmagic/core` 的环境检测类，用于检测当前运行环境的设备和系统信息。

## 构造函数

```typescript
new Env(ua?: string)
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `ua` | `string` | User Agent 字符串（可选，默认使用 `navigator.userAgent`） |

## 属性

所有属性均为只读布尔值：

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
