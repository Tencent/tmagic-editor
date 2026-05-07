# 工具函数

`@tmagic/core` 导出的工具函数。

## style2Obj

- **参数：**
  - `{string} style` CSS 样式字符串

- **返回：**
  - `{object}` 样式对象

- **详情：**

  将 CSS 样式字符串转换为对象格式。若入参不是字符串，则原样返回。

- **示例：**

```typescript
import { style2Obj } from '@tmagic/core';

const styleObj = style2Obj('width: 100px; height: 200px;');
console.log(styleObj); // { width: '100px', height: '200px' }
```

## fillBackgroundImage

- **参数：**
  - `{string} value` 背景图片 URL

- **返回：**
  - `{string}` 完整的 CSS 背景图片值

- **详情：**

  填充背景图片 URL 为完整的 CSS 格式。

- **示例：**

```typescript
import { fillBackgroundImage } from '@tmagic/core';

const bg = fillBackgroundImage('https://example.com/image.png');
console.log(bg); // 'url(https://example.com/image.png)'
```

## getTransform

- **参数：**
  - `{Record<string, string> | string} value` transform 配置（对象或 CSS 字符串）
  - `{JsEngine} jsEngine` JS 引擎类型

- **返回：**
  - `{string | Record<string, string>[]}` CSS transform 字符串；当 `jsEngine === 'hippy'` 时返回数组格式

- **详情：**

  根据配置生成 CSS transform。当 `jsEngine === 'hippy'` 时，会将 `"rotate(90deg) scale(1.5)"` 这样的字符串解析成 `[{ rotate: '90deg' }, { scale: '1.5' }]` 形式以适配 Hippy；其它情况下返回标准 CSS transform 字符串。

## transformStyle

- **参数：**
  - `{Record<string, any> | string} style` 样式对象或 CSS 字符串
  - `{JsEngine} jsEngine` JS 引擎类型

- **返回：**
  - `{object}` 转换后的样式对象

- **详情：**

  转换样式对象，将数值转换为 rem 单位（移动端适配）。当 `style` 为字符串时，会先用 `style2Obj` 解析为对象再处理。

- **示例：**

```typescript
import { transformStyle } from '@tmagic/core';

const style = transformStyle({ width: 100, height: 200 }, 'browser');
console.log(style); // { width: '1rem', height: '2rem' }
```

## 常量

### COMMON_EVENT_PREFIX

- **值：** `'magic:common:events:'`

- **详情：**

  通用事件前缀。

### COMMON_METHOD_PREFIX

- **值：** `'magic:common:actions:'`

- **详情：**

  通用方法前缀。

- **示例：**

```typescript
import { COMMON_EVENT_PREFIX, COMMON_METHOD_PREFIX } from '@tmagic/core';

const eventKey = `${COMMON_EVENT_PREFIX}click`;
const methodKey = `${COMMON_METHOD_PREFIX}show`;
```
