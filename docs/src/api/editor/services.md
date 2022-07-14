# Services

## editorService

### set

- **参数：**

  - `{'root' | 'page' | 'parent' | 'node'} name`
  - `{MNode} value`

- **返回：**

  - {[MNode](https://github.com/Tencent/tmagic-editor/blob/master/packages/schema/src/index.ts)}

- **用法：**

  设置当前指点节点配置
  
  'root': 当前整个配置，也就是当前编辑器的值

  'page': 当前正在编辑的页面配置

  'parent': 当前选中的节点的父节点

  'node': 当前选中的节点

- **示例：**

```js
import { editorService } from '@tmagic/editor';

const node = editorService.get('node');

node.name = 'new name';

editorService.set('node', node);

```

### get


- **参数：**

  - `{'root' | 'page' | 'parent' | 'node' | 'stage' | 'highlightNode' | 'pageLength'} name`

- **返回：**

  - {[MNode](https://github.com/Tencent/tmagic-editor/blob/master/packages/schema/src/index.ts)}

- **用法：**

  获取当前指点节点配置

  'root': 当前整个配置，也就是当前编辑器的值

  'page': 当前正在编辑的页面配置

  'parent': 当前选中的节点的父节点

  'node': 当前选中的节点

  'stage': [StageCore](../../api/stage/core.md)实例

  'highlightNode': 当前高亮的Dom

  'modifiedNodeIds': 当前已修改未保存的组件id

  'pageLength': 当前的页面数量

- **示例：**

```js
import { toRaw } from 'vue';
import { editorService } from '@tmagic/editor';

const node = editorService.get('node');

console.log(toRaw(node));
```

### getNodeInfo

- **参数：**

  - `{number | string}` id

- **返回：**

  - {[EditorNodeInfo](https://github.com/Tencent/tmagic-editor/blob/master/packages/editor/src/type.ts)}

- **用法：**

  根据id获取组件、组件的父组件以及组件所属的页面节点

- **示例：**

```js
import { toRaw } from 'vue';
import { editorService } from '@tmagic/editor';

const info = editorService.getNodeInfo('text_123');

console.log(toRaw(info.node));
console.log(toRaw(info.parent));
console.log(toRaw(info.page));
```

### getNodeById

- **参数：**

  - `{number | string}` id

- **返回：**

  - {[MNode](https://github.com/Tencent/tmagic-editor/blob/master/packages/schema/src/index.ts)} 组件节点配置

- **用法：**

  根据id获取组件的信息

- **示例：**

```js
import { toRaw } from 'vue';
import { editorService } from '@tmagic/editor';

const node = editorService.getNodeById('text_123');

console.log(toRaw(node));
```

### getParentById

- **参数：**

  - `{number | string}` id

- **返回：**

  - {[MNode](https://github.com/Tencent/tmagic-editor/blob/master/packages/schema/src/index.ts)} 指点组件的父节点配置

- **用法：**

  根据ID获取指点节点的父节点配置

- **示例：**

```js
import { toRaw } from 'vue';
import { editorService } from '@tmagic/editor';

const parent = editorService.getParentById('text_123');

console.log(toRaw(parent));
```


### select

- **参数：**

  - `{number | string | MNode}` config

- **返回：**

  当前选中的节点配置

- **用法：**

  选中指点节点（将指点节点设置成当前选中状态）

- **示例：**

```js
import { editorService } from '@tmagic/editor';

editorService.select('text_123');
```

### add

- **参数：**

  - {[AddMNode](https://github.com/Tencent/tmagic-editor/blob/master/packages/editor/src/type.ts)} param0 将要添加的组件节点配置
  - {[MContainer](https://github.com/Tencent/tmagic-editor/blob/master/packages/schema/src/index.ts) | null} parent 要添加到的容器组件节点配置，如果不设置，默认为当前选中的组件的父节点

- **返回：**

  添加后的节点

- **用法：**

  向指点容器添加组件节点

- **示例：**

```js
import { editorService } from '@tmagic/editor';

editorService.add({
  type: 'text',
  // ...
});

const parent = editorService.getParentById('text_123');

editorService.add({
  type: 'text',
  // ...
}, parent);
```

### remove

- **参数：**

  - {[MNode](https://github.com/Tencent/tmagic-editor/blob/master/packages/schema/src/index.ts)} node

- **返回：**

  删除的组件配置

- **用法：**

  删除组件

- **示例：**


```js
import { editorService } from '@tmagic/editor';

const node = editorService.get('node');
editorService.remove(node);
```

- ### update

- **参数：**

  - {[MNode](https://github.com/Tencent/tmagic-editor/blob/master/packages/schema/src/index.ts)} config

- **返回：**

  更新后的节点配置

- **用法：**

  更新节点

- **示例：**

```js
import { editorService } from '@tmagic/editor';

const node = editorService.get('node');
node.name = 'new name';
editorService.update(node);
```

- ### sort

- **参数：**

  - `{number | string}` id1
  - `{number | string}` id2

- **用法：**

  将id为id1的组件移动到id为id2的组件位置上，例如：[1,2,3,4] -> sort(1,3) -> [2,1,3,4]

- **示例：**

```js
import { editorService } from '@tmagic/editor';

const parent = editorService.get('parent');
editorService.update(parent[0].id, parent[3].id);
```

- ### copy

- **参数：**

  - {[MNode](https://github.com/Tencent/tmagic-editor/blob/master/packages/schema/src/index.ts)} config

- **用法：**

  将组将节点配置转化成string，然后存储到localStorage中

- **示例：**

```js
import { editorService } from '@tmagic/editor';

const node = editorService.get('node');
editorService.copy(node);
```

- ### paste

- **参数：**

  - `{Position}` position 可选，如果设置，指定组件位置

- **返回：**

  添加后的组件节点配置

- **用法：**

  从localStorage中获取节点，然后添加到当前容器中

- **示例：**

```js
import { editorService } from '@tmagic/editor';

editorService.paste({ left: 0, top: 0 });`
```

- ### alignCenter

- **参数：**

  {[MNode](https://github.com/Tencent/tmagic-editor/blob/master/packages/schema/src/index.ts)} config

- **返回：**

  当前组件节点配置

- **用法：**

  将指点节点设置居中

- **示例：**

```js
import { editorService } from '@tmagic/editor';

const node = editorService.get('node');
editorService.alignCenter(node);
```

- ### moveLayer

- **参数：**

  - `{number | 'top' | 'bottom'` offset

- **用法：**

  移动当前选中节点位置

- **示例：**

```js
import { editorService } from '@tmagic/editor';

editorService.moveLayer('top'); // 置底
editorService.moveLayer('bottom'); // 置顶
editorService.moveLayer(1); // 上移一层 
editorService.moveLayer(-1); // 下移一层 
```

- ### undo

- **返回：**

  上一次数据

- **用法：**

  撤销当前操作

- **示例：**

```js
import { editorService } from '@tmagic/editor';

editorService.undo();
```

- ### redo

- **返回：**

  下一步数据

- **用法：**

  恢复到下一步

- **示例：**

```js
import { editorService } from '@tmagic/editor';

editorService.redo();
```

- ### move

- **参数：**

  - `{number}` left
  - `{number}` top


- **用法：**

  绝对定位布局下，移动组件位置

- **示例：**

```js
import { editorService } from '@tmagic/editor';

editorService.move(1, 1);
```

### usePlugin

- **参数：**

  - `{Record<string, Function>` options
  

- **用法：**
  扩展editorService中的方法（'select', 'add', 'remove', 'update', 'sort', 'copy', 'paste', 'center', 'moveLayer', 'undo', 'redo'）

  对于每一个方法，都可以为其添加before/after两个扩展方法，分别在该方法运行前与运行后调用

  调用时的参数会透传到before方法的参数中, 然后before的return 会作为原方法的参数和after的参数，after最后一个个参数则是原方法的return值

- **示例：**

```js
import { editorService } from '@tmagic/editor';

editorService.usePlugin({
  beforeAdd(value) {
    console.log(value); // { type: 'text' }
    console.log('before add');
    return [{
      type: 'button',
    }];
  },
  afterAdd(value, result) {
    console.log(value) // { type: 'button' }
    console.log('after add');
  },
});

const node = await editorService.add({
  type: 'text';
});

console.log(node); // { type: 'button' }

// console 输出如下：
// { type: 'text' }
// before add
// add
// { type: 'button' }
// after add
// { type: 'button' }
```

### use

- **参数：**

  - `{Record<string, Function>` options
  

- **用法：**
  使用中间的方式扩展editorService中的方法（'select', 'add', 'remove', 'update', 'sort', 'copy', 'paste', 'center', 'moveLayer', 'undo', 'redo'）

- **示例：**

```js
import { editorService } from '@tmagic/editor';

editorService.use({
  add(value, next) {
    console.log('before');
    next();
    console.log('after')
  },
});

editorService.add({
  type: 'text';
});

// console 输出如下：
// before
// add
// after
```


:::tip
可以多次为同一个方法添加扩展，运行时会根据添加的顺序依次调用
:::

## propsService

### setPropsConfig

- **参数：**

  - `{string}` type 组件类型
  - [FormConfig](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts) config 组件属性表单配置

- **用法：**

  为指定类型组件设置组件属性表单配置

- **示例：**

```js
import { propsService } from '@tmagic/editor';

propsService.setPropsConfig('text', [
  {
    name: 'text',
    text: '文本',
  },
  {
    name: 'multiple',
    text: '多行文本',
    type: 'switch',
  },
]);
```

### getPropsConfig

- **参数：**

  - `{string}` type 组件类型

- **返回：**

  组件属性表单配置

- **用法：**

  获取指点类型的组件属性表单配置

- **示例：**

```js
import { propsService } from '@tmagic/editor';

propsService.getPropsConfig('text');
```

### setPropsValue

- **参数：**

  - `{string}` type 组件类型
  - `{Object}` value 组件初始值

- **用法：**

  为指点类型组件设置组件初始值

- **示例：**

```js
import { propsService } from '@tmagic/editor';

propsService.setPropsValue('text', {
  text: '文本',
  multiple: true,
});
```

### getPropsValue

- **参数：**

  - `{string}` type 组件类型

- **返回：**

  组件初始值

- **用法：**

  获取指定类型的组件初始值

- **示例：**

```js
import { propsService } from '@tmagic/editor';

propsService.getPropsValue('text');
```

### usePlugin

扩展propsService中的方法（'setConfig', 'getConfig', 'setValue', 'getValue'）

参照[editorService.usePlugin](#useplugin)

### use

扩展propsService中的方法（'setConfig', 'getConfig', 'setValue', 'getValue'）

参照[editorService.use](#use)
