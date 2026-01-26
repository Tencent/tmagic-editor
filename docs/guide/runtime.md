# RUNTIME
本章详细介绍如何深入理解tmagic-editor的打包，以及如何根据需求定制，修改tmagic-editor的页面打包发布方案。页面发布、打包相关的定制化开发，需要使用tmagic-editor的业务方，搭建好基于开源tmagic-editor的管理平台、存储服务等配套设施。

## runtime 是什么

runtime是用来解析DSL的执行环境，用于渲染 DSL 呈现页面。

编辑器生成出来的DSL需要通过 runtime 来渲染。

## 实现一个 runtime

:::tip
可以使用`npm create tmagic` 来快速创建一个runtime项目。
:::

创建出来的项目会包含page、playground两个目录。
```bash
.
├── page
├── playground
```

page用于生产环境

playground用于编辑器中

:::tip
想要了解DSL的解析以及runtime与编辑器的通信，可以前往[教程](/guide/tutorial/index.md)
:::
