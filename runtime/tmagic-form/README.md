# TMagicFormRuntime
TMagicFormRuntime 基于@tmagic/form的编辑器runtime

## 环境准备

先基于[tmagic-editor](https://tencent.github.io/tmagic-editor/docs/guide/)将编辑器搭建起来

按住依赖

```bash
pnpm add @tmagic/tmagic-form-runtime
```

```html
<TMagicEditor
  :component-group-list="componentGroupList"
  :props-configs="propsConfigs"
  :render="render"
  :can-select="canSelect"
  :disabled-page-fragment="true"
  :stage-rect="{ width: 'calc(100% - 70px)', height: '100%' }"
  :moveable-options="{ resizable: false }"

  ...
>
</TMagicEditor>
```

```ts
import {
  canSelect,
  COMPONENT_GROUP_LIST as componentGroupList,
  propsConfigs,
  useRuntime,
} from '@tmagic/tmagic-form-runtime';

const { render } = useRuntime();
```

## 表单配置需要发请求时

`@tmagic/form` 的 `request` 是模块级配置，`setConfig` 会整对象替换。请在宿主 Vue
组件的 setup 中调用 `useRuntime()`：此时会读取宿主 `$MAGIC_FORM`，与 `formOptions`
浅合并后再安装 formPlugin，默认不会清空宿主已有的 `request` / `flat` 等。

若宿主未配 `request`，或画布侧需要覆盖，通过 `formOptions` 传入。`request` 的语义与
宿主 `editorPlugin` 一致：入参为 `{ method, url, data, ... }`，**resolve 出接口 body**
（不要返回整个 Response / axios response）。

```ts
const { render } = useRuntime({
  formOptions: {
    request: async ({ url, method = 'GET', data }) => {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'GET' ? undefined : JSON.stringify(data),
      });
      return response.json();
    },
  },
});
```
