# uiService方法

## set

- **参数：**

  - `{keyof UiState}` name 状态键名
  - `{any}` value 状态值

- **返回：**

  - `{void}`

- **详情：**

  设置UI服务的状态
  
  可用的状态键：
  - `uiSelectMode`: UI选择模式
  - `showSrc`: 是否显示源码
  - `showStylePanel`: 是否显示样式面板
  - `zoom`: 缩放比例
  - `stageContainerRect`: 画布容器尺寸
  - `stageRect`: 画布尺寸
  - `columnWidth`: 列宽度配置
  - `showGuides`: 是否显示参考线
  - `showRule`: 是否显示标尺
  - `propsPanelSize`: 属性面板尺寸
  - `showAddPageButton`: 是否显示添加页面按钮
  - `showPageListButton`: 是否显示页面列表按钮
  - `hideSlideBar`: 是否隐藏侧边栏
  - `sideBarItems`: 侧边栏项目
  - `navMenuRect`: 导航菜单尺寸
  - `frameworkRect`: 框架尺寸

- **示例：**

```js
import { uiService } from '@tmagic/editor';

// 设置缩放比例
uiService.set('zoom', 1.5);

// 设置画布尺寸
uiService.set('stageRect', { width: 375, height: 667 });

// 显示/隐藏参考线
uiService.set('showGuides', true);

// 显示/隐藏标尺
uiService.set('showRule', true);
```

## get

- **参数：**

  - `{keyof UiState}` name 状态键名

- **返回：**

  - `{any}` 对应的状态值

- **详情：**

  获取UI服务的状态值

- **示例：**

```js
import { uiService } from '@tmagic/editor';

const zoom = uiService.get('zoom');
console.log('当前缩放:', zoom);

const stageRect = uiService.get('stageRect');
console.log('画布尺寸:', stageRect);
```

## zoom

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{number}` zoom 缩放增量（可以为负数）

- **返回：**

  - `{Promise<void>}`

- **详情：**

  调整缩放倍数，最小为0.1
  
  传入的值会被累加到当前缩放倍数上

- **示例：**

```js
import { uiService } from '@tmagic/editor';

// 放大0.1倍
await uiService.zoom(0.1);

// 缩小0.1倍
await uiService.zoom(-0.1);

// 当前缩放如果是1.0，执行zoom(0.5)后变为1.5
await uiService.zoom(0.5);
```

## calcZoom

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：** 无

- **返回：**

  - `{Promise<number>}` 计算出的缩放倍数

- **详情：**

  计算"缩放以适应"的倍数
  
  根据画布容器的尺寸和画布尺寸自动计算出合适的缩放比例，使画布完全显示在容器内

- **示例：**

```js
import { uiService } from '@tmagic/editor';

const fitZoom = await uiService.calcZoom();
console.log('适应缩放:', fitZoom);

// 应用缩放以适应
uiService.set('zoom', fitZoom);
```

## resetState

- **参数：** 无

- **返回：**

  - `{void}`

- **详情：**

  重置UI服务状态到初始值

- **示例：**

```js
import { uiService } from '@tmagic/editor';

uiService.resetState();
```

## destroy

- **参数：** 无

- **返回：**

  - `{void}`

- **详情：**

  销毁 uiService，重置状态并移除所有事件监听和插件

- **示例：**

```js
import { uiService } from '@tmagic/editor';

uiService.destroy();
```

## use

使用中间件的方式扩展方法，上述方法中标记有`扩展支持： 是`的方法都支持使用use扩展

- **示例：**

```js
import { uiService } from '@tmagic/editor';

uiService.use({
  async zoom(value, next) {
    console.log('缩放前:', uiService.get('zoom'));
    await next();
    console.log('缩放后:', uiService.get('zoom'));
  },
});
```

## usePlugin

- **详情：**

相对于[use](#use), usePlugin支持更加灵活更加细致的扩展， 上述方法中标记有`扩展支持： 是`的方法都支持使用usePlugin扩展

每个支持扩展的方法都支持定制before、after两个hook来干预原有方法的行为，before可以用于修改传入参数，after可以用于修改返回的值

- **示例：**

```js
import { uiService } from '@tmagic/editor';

uiService.usePlugin({
  beforeZoom(value) {
    console.log('缩放增量:', value);
    return [value];
  },
  
  afterCalcZoom(result) {
    console.log('计算的缩放:', result);
    // 可以修改返回值
    return result;
  },
});
```

## removeAllPlugins

- **详情：**

删掉当前设置的所有扩展

- **示例：**

```js
import { uiService } from '@tmagic/editor';

uiService.removeAllPlugins();
```

