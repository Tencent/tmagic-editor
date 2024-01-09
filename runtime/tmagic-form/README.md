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