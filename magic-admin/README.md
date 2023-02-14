# 介绍

我们提供了与编辑器、表单等配套的管理端供开发者直接使用。管理端（magic-admin）代码存放于[开源仓库](https://github.com/Tencent/tmagic-editor)"magic-admin"目录下，可作为一个独立项目运行。我们提供这个管理端一方面期望开发者可以更清晰的了解一个项目从编辑到生成的整个流程，另一方面，开发者也可以
在 magic-admin 的基础上快速搭建适合自己业务的管理平台。

管理端提供了如下能力：

- 项目列表展示，查询
- 项目创建，复制
- 项目编辑以及 AB TEST 配置能力
- 项目发布以及发布状态查看和管理

<img src="https://vfiles.gtimg.cn/vupload/20211129/81d34a1638168945248.png">

## 开发调试

magic-admin 管理端分为 web 端和 server 端，目录结构如下：

**web 目录结构**

```
.
├── babel.config.js
├── jest.config.js
├── package.json
├── package-lock.json
├── public
│   ├── favicon.ico
│   └── index.html
├── README.md
├── src
│   ├── api（web 端接口文件）
│   ├── App.vue
│   ├── assets
│   ├── components（组件文件）
│   ├── config（表单和状态配置文件）
│   ├── main.ts（入口文件）
│   ├── plugins（插件）
│   ├── router（路由）
│   ├── shims-vue.d.ts
│   ├── store（全局变量的封装）
│   ├── typings
│   ├── use（核心逻辑）
│   ├── util（公共方法）
│   └── views
├── tests
│   ├── unit（测试用例文件）
│   └── utils.ts
├── tsconfig.json
├── types（声明文件）
│   ├── axios-jsonp
│   ├── index.d.ts
│   └── shims-vue.d.ts
└── vue.config.js
```

**server 目录结构**

```
.
├── jest.config.ts
├── package.json
├── package-lock.json
├── pm2.config.js
├── src
│   ├── config（配置文件）
│   ├── controller（控制器）
│   ├── database（数据库初始化 sql 文件）
│   ├── index.ts（入口文件）
│   ├── models（数据库模型定义，使用`sequelize`）
│   ├── routers（路由文件）
│   ├── sequelize（数据库实例初始化文件）
│   ├── service（service 文件）
│   ├── template（发布所需模板文件）
│   ├── typings（声明文件）
│   └── utils（公共方法文件）
├── tests
│   └── unit（测试用例）
└── tsconfig.json
```

**开发者本地调试 magic-admin 请按照如下步骤：**

- 数据库：
  我们在 magic-admin/server/src/database/init.sql 中准备了库表初始化文件，开发者首先需要创建所需数据表

  - 表名：magic_act_info
    项目基础信息表，包含项目 ID，项目名称，项目负责人，项目时间等项目基础信息。
  - 表名：magic_ui_config
    页面配置表，magic-admin 支持了一个项目中包含多个项目页面的能力，因此每个页面的组件配置信息将分别存储。

- 启动 web 端：

```bash
$ cd magic-admin/web
$ npm i
$ npm run serve
```

- 启动 server 端

```bash
$ cd magic-admin/server
$ npm i
$ npm run dev
```

server 文件夹下面这些敏感文件，需要开发者参考示例进行替换：

```
.
├── src
│   ├── config
│   │   ├── databaseExample.ts（数据库配置文件）
│   │   ├── keyExample.ts（加密秘钥配置）
```

- 关于登录态：
  magic-admin 在库表中为开发者预留了用户信息字段（项目负责人），开发者可以根据自身业务需要，实现用户登录态

```js
// web/src/App.vue
watchEffect(async () => {
  // 登录态获取交由开发者实现
  const userName = process.env.VUE_APP_USER_NAME || "defaultName";
  Cookies.set("userName", userName);
});
```

## 管理端能力

- **项目状态**

我们将项目的状态分为三种：修改中，部分页面已发布，全部页面已发布。在项目列表页面，可以展开查看每个项目页面的状态。

修改中：项目所有页面均在编辑状态

部分已发布：项目的一些页面在编辑状态，一些页面已发布

已发布：项目所有页面均已发布

- **在管理端引入 runtime**

在管理端中我们提供了一个可视化的模拟画布，他需要依赖 runtime 核心库，因此我们需要先在 magic 根目录下运行

```js
cd magic
npm run build:runtime:admin
```

将 /runtime/vue3|vue2|react/dist 文件夹复制到 /magic-admin/serve/static 目录下。

```
mkdir ./magic-admin/server/static/vue3
cp -rf ./runtime/vue3/dist/* ./magic-admin/server/static/vue3
```

上面的操作我们提供了/magic-admin/setup.sh 脚本文件来实现，开发者可以参考该脚本文件来搭建流水线。

[runtime 详细介绍](https://tencent.github.io/tmagic-editor/docs/page/introduction.html#runtime)

- **AB TEST**

当项目开发者需要对页面进行 AB TEST 测试时，可以在项目中创建多个项目页面，并且在项目配置中进行配置
<img src="https://vfiles.gtimg.cn/vupload/20211129/c11fa81638173475771.png">
这里仅为管理端的配置，通过这里我们将在项目配置文件中得到类似如下结构的 abtest 信息，开发者可以在页面加载时根据 DSL 的 abtest 字段进行判断。

```js
abTest: [
  {
    name: "abtest1",
    type: ["pgv_pvid"],
    pageList: [
      {
        pageName: "page_1",
        proportion: "50",
      },
      {
        pageName: "page_2",
        proportion: "50",
      },
    ],
  },
];
```

- **项目保存**

项目创建之后的配置信息分为两部份：项目基础信息，页面组件配置信息。
项目基础信息是整个项目共用的配置项，对应 magic_act_info 数据表
页面组件配置信息是一个项目中单个页面的配置项，对应 magic_ui_config 数据表

项目基础信息不在 magic-editor 支持范围以内，需要开发者自行结合 @tmagic/form 按需开发。管理端示例中这部分内容在页面右上角【项目配置】抽屉页

页面组件配置信息是指 magic-editor 中的 modelValue，他是一份 js schema 包含了页面内组件的配置内容，也是页面渲染的关键依赖文件。[DSL 概念参考](https://tencent.github.io/tmagic-editor/docs/page/introduction.html#%E7%BC%96%E8%BE%91%E5%99%A8%E4%BA%A7%E7%89%A9-DSL)

magic-admin 支持一个项目中创建多个项目页面的能力，因此，在项目保存的时候，我们的做法是将每个页面单独作为一条记录保存，比如项目 A 中包含页面 1 和页面 2
保存之后我们将得到

magic_act_info 表
| act_id | act_name | operator | act_status | abtest_raw | ... |
| --- | --- | --- | --- |--- |--- |
| 123 |项目 A | username | 修改中| []|... |

magic_ui_config 表
| id | act_id | c_dist_code | page_title | page_publish_status |... |
| --- | --- | --- | --- |--- | --- |
| 1 |123 | 页面 1 的 DSL 配置 |页面 1 |修改中|...|
| 2 |123 | 页面 2 的 DSL 配置 |页面 2|修改中|...|

- **项目发布**

  管理端的项目发布是对[页面发布](https://tencent.github.io/tmagic-editor/docs/page/introduction.html#%E9%A1%B5%E9%9D%A2%E5%8F%91%E5%B8%83) 的实践。
  原始的页面框架 page.html 需要通过 runtime 打包生成，注入的 DSL 保存在 magic_ui_config 表 c_dist_code 字段中。
  发布时将 DSL 文件注入到 page.html 中，写入 server/assets/publish 目录下，访问路径： http://localhost/publish/${page_name}.html

## 部署

::: tip
前提条件：node 环境>=14.15
:::

如需使用流水线部署，请参考 /magic-admin/setup.sh
