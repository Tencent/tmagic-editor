# [1.1.0-beta.10](https://github.com/Tencent/tmagic-editor/compare/v1.1.0-beta.9...v1.1.0-beta.10) (2022-08-17)


### Bug Fixes

* **editor:** react runtime中添加没有即使渲染 ([9d2e221](https://github.com/Tencent/tmagic-editor/commit/9d2e2210d1dc8398a301df74bd9360c60c216317))
* **editor:** 复制页面错误 ([5f0e421](https://github.com/Tencent/tmagic-editor/commit/5f0e421550717eb8709cf3a11aeb8ce4396eb2ca))
* **form:** text按方向键减到负数后，继续按方向键无效 ([e1c0614](https://github.com/Tencent/tmagic-editor/commit/e1c061426533473f9911e56b2c64b08a6f52f57e)), closes [#261](https://github.com/Tencent/tmagic-editor/issues/261)
* **playground,runtime:** 拖动添加弹窗时初始位置不对 ([41a8400](https://github.com/Tencent/tmagic-editor/commit/41a84000956fea8d73fdf171df4a232cec4ca99c))


### Features

* **cli:** 自动install组件包，支持pnpm,npm,yarn ([c19afda](https://github.com/Tencent/tmagic-editor/commit/c19afda58c0cc34312a4eb5950382f9e3e092c6f))
* **core:** 旋转角度支持配置不带单位的数值 ([b1bd7a8](https://github.com/Tencent/tmagic-editor/commit/b1bd7a870e748890c176339460176cd7deb2d2e6)), closes [#260](https://github.com/Tencent/tmagic-editor/issues/260)
* **editor,stage:** runtime-api中的add/update/remove中的参数加上parentId ([59e6aff](https://github.com/Tencent/tmagic-editor/commit/59e6aff70a288c69197a85f08373abd1400f78a2))
* **editor:** runtime add api中parent参数加回去 ([2cde4bb](https://github.com/Tencent/tmagic-editor/commit/2cde4bb5a016d22ac184014d7b45b55cd0e75631))



# [1.1.0-beta.9](https://github.com/Tencent/tmagic-editor/compare/v1.1.0-beta.8...v1.1.0-beta.9) (2022-08-12)


### Bug Fixes

* **editor:** 删除节点后，标记父节点为修改状态 ([0e82f65](https://github.com/Tencent/tmagic-editor/commit/0e82f652a9c72acbd9fae4e96d709e3fa594e411))
* **editor:** 水平居中添加了两个历史堆栈 ([8827743](https://github.com/Tencent/tmagic-editor/commit/882774311a8245769de92d68d3d43b523e85e571))
* **playground:** pc预览适配 ([31d60eb](https://github.com/Tencent/tmagic-editor/commit/31d60eb1bac7efb215fe9a613b6c7d3d0a2e66de))
* **stage:** 修复多选组件处于拖拽状态时画布组件命中高亮的问题，优化多选拖拽体验 ([#265](https://github.com/Tencent/tmagic-editor/issues/265)) ([8f5acff](https://github.com/Tencent/tmagic-editor/commit/8f5acff0a64925dff8913e50c067543128130d27))
* **stage:** 修复非多选状态下，点击选中组件切换为普通选中状态 ([#254](https://github.com/Tencent/tmagic-editor/issues/254)) ([cf9768b](https://github.com/Tencent/tmagic-editor/commit/cf9768ba96e043f9923a7c899218567dc6646167))
* **stage:** 多选时禁止拖出边界 ([edf66cc](https://github.com/Tencent/tmagic-editor/commit/edf66cc0768149387dca0993c901b2a7489727dd))


### Features

* **cli:** 支持temp下的config.ts配置文件，该模式下的配置文件会默认被删掉 ([52973d2](https://github.com/Tencent/tmagic-editor/commit/52973d2a34237e36042da2130e7296b609f7fc0f))
* **editor,stage:** 多选支持居中操作 ([c949590](https://github.com/Tencent/tmagic-editor/commit/c949590f805b6778f4f02e873f58bde1011cbefe))
* **stage,editor:** 拖入指定容器支持配置成按住alt才开启 ([4f8ea94](https://github.com/Tencent/tmagic-editor/commit/4f8ea94ee8ed5dcf719457d243f40314e11b599b))
* **stage:** 暂时禁用多选resizable ([b1ce0be](https://github.com/Tencent/tmagic-editor/commit/b1ce0be682ef5ddfce9b71e36864bfc0c79c969f))



# [1.1.0-beta.8](https://github.com/Tencent/tmagic-editor/compare/v1.1.0-beta.7...v1.1.0-beta.8) (2022-08-11)


### Bug Fixes

* **editor:** icon 图片模式样式修改 ([23617a6](https://github.com/Tencent/tmagic-editor/commit/23617a63e9185e39269bacdc80186b05e1bd6709))
* **editor:** 画布右键菜单中粘贴按钮显示条件修改 ([beee67b](https://github.com/Tencent/tmagic-editor/commit/beee67b3eb99b33584e5b7df42f6f4d69b3ee8e7))
* **ui-vue2:** button,container,text formconfig补充完整 ([5ccb5f1](https://github.com/Tencent/tmagic-editor/commit/5ccb5f1ec9a1e746ca320d64b08c8024fe761e9b))


### Features

* **editor:** editorService.add支持添加多个组件 ([b6fa064](https://github.com/Tencent/tmagic-editor/commit/b6fa064b0bc11fcaa289650d932bab22b8638f04))



# [1.1.0-beta.7](https://github.com/Tencent/tmagic-editor/compare/v1.1.0-beta.6...v1.1.0-beta.7) (2022-08-08)


### Bug Fixes

* **editor:** uiselect没有注册 ([7de649d](https://github.com/Tencent/tmagic-editor/commit/7de649d8c4f4bd61f72f835f0431a1250850da47))
* **editor:** 修复先单击选中页面,再进行多选无法选中的问题 ([46e0e23](https://github.com/Tencent/tmagic-editor/commit/46e0e2378588d980eb2ed9b52d35c884f7cf9998))
* **editor:** 页面列表显示问题 ([a4dd4ea](https://github.com/Tencent/tmagic-editor/commit/a4dd4eac02b1656e4945d5ec5acad36881c9fc4f))
* **form:** daterange不会自动更新 ([a7057d2](https://github.com/Tencent/tmagic-editor/commit/a7057d2568f58825a92f7f2abde2763114d1d180))


### Features

* **admin:** 更新runtime ([eba6cbc](https://github.com/Tencent/tmagic-editor/commit/eba6cbccde077a98ed4cc064ca4410ae571367df))
* **core:** 新增store ([5f78bbd](https://github.com/Tencent/tmagic-editor/commit/5f78bbd7b727f320d390034f9cfce19efdf2bcb0))
* **stage:** 多选快捷键改成ctrl/cmd ([3d1a803](https://github.com/Tencent/tmagic-editor/commit/3d1a803ec9e56debc7aa1209271af6fd2753fecc))
* **utils:** moment换成dayjs ([9ac3e12](https://github.com/Tencent/tmagic-editor/commit/9ac3e12487b4a6acd49b20731b824779eac248d5))



# [1.1.0-beta.6](https://github.com/Tencent/tmagic-editor/compare/v1.1.0-beta.5...v1.1.0-beta.6) (2022-08-05)


### Bug Fixes

* **admin:** npm install 出错 ([259a5aa](https://github.com/Tencent/tmagic-editor/commit/259a5aa5305929a5436d2f573456976128c565a0)), closes [#207](https://github.com/Tencent/tmagic-editor/issues/207)
* **docs:** vuepress暂不支持vite3.0 ([6e19989](https://github.com/Tencent/tmagic-editor/commit/6e199897ac41695f6268a3fd3819f9d1a021521c))
* **editor:** id可能重复 ([#221](https://github.com/Tencent/tmagic-editor/issues/221)) ([a02fd2c](https://github.com/Tencent/tmagic-editor/commit/a02fd2c695ac2cd07c8025f58a31a010f2a8004b))
* **editor:** 修复添加StorageService定义导出带来的构建错误 ([2008bc7](https://github.com/Tencent/tmagic-editor/commit/2008bc7da1e24530b208840173f062c0f6f1a61f))
* **editor:** 添加组件粘贴操作支持偏移量 ([9ffecf6](https://github.com/Tencent/tmagic-editor/commit/9ffecf62f751397548da3181084c2a59b1111170))
* **stage:** 单选后，粘贴多个组件，原来的单选状态没有取消 ([a4e91fa](https://github.com/Tencent/tmagic-editor/commit/a4e91fa66daf202fbe257d7a4174e7e625a241c6))


### Features

* **cli:** 支持配置temp文件夹，默认.tmagic ([624da4c](https://github.com/Tencent/tmagic-editor/commit/624da4c29a8f11b9d40a4a20c0d38c5a8a76f33d))
* **cli:** 新增tamgic-cli,用于runtime 依赖生成 ([f18e7b2](https://github.com/Tencent/tmagic-editor/commit/f18e7b275db98d84d6eabc3291b9e7045adae44d))
* **cli:** 生成的entry文件不再在window挂对象，通过构建自动挂载 ([32fdf05](https://github.com/Tencent/tmagic-editor/commit/32fdf05eb185a3d0ffd6bba5791763ba5f3a5681))
* **editor:** 多选粘贴后同步选中粘贴的多个元素,并支持拖拽,粘贴删除支持多个元素同时撤销到上一步 ([8c64ea7](https://github.com/Tencent/tmagic-editor/commit/8c64ea798ab005a1e7e1ac97b4ef4c00602d6794))
* **editor:** 多选菜单支持复制粘贴删除 ([#217](https://github.com/Tencent/tmagic-editor/issues/217)) ([b702857](https://github.com/Tencent/tmagic-editor/commit/b702857aad4efdb7635a6ce468478c04567ebce6))
* **editor:** 完善storageService功能 ([574e03f](https://github.com/Tencent/tmagic-editor/commit/574e03f685e44d08fb43207723af79a08ee0a22f)), closes [#224](https://github.com/Tencent/tmagic-editor/issues/224)
* **editor:** 添加storageService服务 ([#225](https://github.com/Tencent/tmagic-editor/issues/225)) ([da0cb7d](https://github.com/Tencent/tmagic-editor/commit/da0cb7d6143a0a021340caa06386d212fb3ca276))
* **runtime,playground:** vue3使用tmagic-cli生成组件依赖入口 ([a57fef4](https://github.com/Tencent/tmagic-editor/commit/a57fef4947888d081c6cdbaa7b0c7b502f5e9e8f))
* **runtime:** vue2/react使用tamgic-cli生成组件依赖入口 ([e8b8d35](https://github.com/Tencent/tmagic-editor/commit/e8b8d35cbd5b37a52ae2bc17ea8e6dafb019b670))
* **stage,runtime:** 去掉runtime getSnapElements 定义 ([e5f0506](https://github.com/Tencent/tmagic-editor/commit/e5f0506a00656eaa96a91525d01b9b918780ee80))



# [1.1.0-beta.5](https://github.com/Tencent/tmagic-editor/compare/v1.1.0-beta.4...v1.1.0-beta.5) (2022-07-29)


### Bug Fixes

* **admin:** 升级tmagic版本,修复第一个活动第一个页面uiconfig中id和page id重复的问题 ([ec1bf1d](https://github.com/Tencent/tmagic-editor/commit/ec1bf1dcb725a2312368023f8b50535dd484ca38))
* **editor:** 已选组件树形拖放时, layout 根据父窗口动态变化 ([#210](https://github.com/Tencent/tmagic-editor/issues/210)) ([340eeb3](https://github.com/Tencent/tmagic-editor/commit/340eeb32d7620fcb58e2aa7b1ca9d8345630319b))
* **editor:** 新增组件id不对 ([fff587d](https://github.com/Tencent/tmagic-editor/commit/fff587d9eb1d614a0a936146b8c101b6aff8c08e))
* **editor:** 新增页面时会有一个error ([aa20c74](https://github.com/Tencent/tmagic-editor/commit/aa20c741313421b22f366c96cef52550b5817a10))
* **editor:** 重复import ([4ff07ea](https://github.com/Tencent/tmagic-editor/commit/4ff07ea5a93a56e278c921ae4b19b6365d5fdf74))
* **stage,runtime,ui-react:** tmagicRuntimeReady时机修改 ([9858327](https://github.com/Tencent/tmagic-editor/commit/9858327eb8ba5ca24ecb2cb60f42625b03612c5e)), closes [#198](https://github.com/Tencent/tmagic-editor/issues/198)
* **stage:** 在 stage 拖拽改变父容器的BUG ([0a1cf06](https://github.com/Tencent/tmagic-editor/commit/0a1cf060a5580ab56dd34abc0d2ad88e09c2ba91))
* 修复多选组件时新增组件的体验问题 ([a4884c5](https://github.com/Tencent/tmagic-editor/commit/a4884c504f4f8289150f3845054f0eeaf73c901e))


### Features

* **stage:** 1) 高亮边框样式加粗 ([a2fb92d](https://github.com/Tencent/tmagic-editor/commit/a2fb92d9880bc852cd630b8354a40f3378f96902))



# [1.1.0-beta.4](https://github.com/Tencent/tmagic-editor/compare/v1.1.0-beta.3...v1.1.0-beta.4) (2022-07-26)


### Bug Fixes

* **editor:** 修正css sass变量 ([940b08b](https://github.com/Tencent/tmagic-editor/commit/940b08b2c579564c3fea9a504b08237262de91a1))
* **editor:** 拖动组件到最右边会多出1px ([bf95925](https://github.com/Tencent/tmagic-editor/commit/bf9592587826fd429533de4456c82e5f7e657a94))
* **editor:** 水平居中 ([dd1ec53](https://github.com/Tencent/tmagic-editor/commit/dd1ec530642290224e7d339f14f8afa9467a62d0))
* **editor:** 画布大小与stageRect配置不相符 ([9747e0f](https://github.com/Tencent/tmagic-editor/commit/9747e0f51617f4fd440c66c4c48ada0dfbbd8ba0))


### Features

* **editor:** editorService.add 的addNode参数对象中加上inputEvent ([c1fc6b8](https://github.com/Tencent/tmagic-editor/commit/c1fc6b8f94721d00661ed7983ea1b49290f06b7d))



# [1.1.0-beta.3](https://github.com/Tencent/tmagic-editor/compare/v1.0.0-rc.7...v1.1.0-beta.3) (2022-07-25)


### Bug Fixes

* **core:** 事件触发时组件未初始化，等组件初始化后再调用事件处理 ([1750467](https://github.com/Tencent/tmagic-editor/commit/1750467d5b0407bba4c388716cd71298c49de8e6))
* **core:** 拼写错误 ([c83d83b](https://github.com/Tencent/tmagic-editor/commit/c83d83b1a15103ce94dd7e224d6c71cec9a8a27b))
* **editor:** moveableOptions默认值中的container有误 ([2377629](https://github.com/Tencent/tmagic-editor/commit/23776299a730d3c440d41be4f1101e4fb909dcf9))
* **editor:** page和container默认value加上items ([10577ae](https://github.com/Tencent/tmagic-editor/commit/10577aea68a63323bc1312faced84bcd5c616d1f))
* **editor:** 修正Editor slot 变量位置 ([ecd80cb](https://github.com/Tencent/tmagic-editor/commit/ecd80cb4a4c83ada6076a09da6a36bda6491ef47))
* **editor:** 指定父节点添加组件 ([d334b69](https://github.com/Tencent/tmagic-editor/commit/d334b697ae71ebe87286b07bdf6bf7e409ea751b))
* **editor:** 编辑器分栏左右各设置最小宽度  fix [#145](https://github.com/Tencent/tmagic-editor/issues/145) ([363330e](https://github.com/Tencent/tmagic-editor/commit/363330e07aea220e0a1efc76823ceeb810005865))
* **form:** date组件初始值 不显示 ([8d5eab0](https://github.com/Tencent/tmagic-editor/commit/8d5eab0ef821b57bc7145e9ccd2dc4db36a6f6d3))
* **form:** el-upload类型读取失败导致Table.vue.d.ts丢失 ([fab8717](https://github.com/Tencent/tmagic-editor/commit/fab8717fcf889ed8c6a4b2ee1569a5760c4ff231))
* **form:** fieldset checkbox chang事件不会触发 ([26c60c3](https://github.com/Tencent/tmagic-editor/commit/26c60c316ae688c41b9b0093ea5ee7d85fcb98af))
* **form:** tabs配置name后出错 ([9454bb3](https://github.com/Tencent/tmagic-editor/commit/9454bb3679881e7a4617ae782a17e6c51d1f12bc))
* **form:** 函数配置中添加config参数 ([7ad80e8](https://github.com/Tencent/tmagic-editor/commit/7ad80e848f81d3a96622540cce44f1fa10d9dc57))
* **form:** 函数配置中添加config参数 ([eae9725](https://github.com/Tencent/tmagic-editor/commit/eae9725ccbbdbe8ffc9ded5af42993cff21bec77))
* **form:** 初始化values时，数组中的对象出现key丢失 ([32e86d8](https://github.com/Tencent/tmagic-editor/commit/32e86d8167f85a77306d5236dc4f885fc4b7b050))
* **form:** 配置了names，validator中的value应为model ([3090bc7](https://github.com/Tencent/tmagic-editor/commit/3090bc77631e1be3974120adf48df938fd546a5e))
* **magic-admin:** 修复发布页面资源路径错误，导致页面无法打开问题 ([7dc0b4e](https://github.com/Tencent/tmagic-editor/commit/7dc0b4e26127d3b53e44465b96d2edf5c71738af))
* **magic-admin:** 画布显示出错 ([7c42f75](https://github.com/Tencent/tmagic-editor/commit/7c42f751a4042e68ad9071fed88fcfb9a13f4ef0))
* **playground:** 小屏幕下设备切换按钮样式问题 ([a4abf5f](https://github.com/Tencent/tmagic-editor/commit/a4abf5feea39300d22757003e48145065ab7672c))
* **runtime:** 解决启动脚本不识别组件包内的插件 ([8b70ede](https://github.com/Tencent/tmagic-editor/commit/8b70edeaf21b9029c9cddf8df9b2845b2a6aba05))
* **stage:** 所有父节点中如果有translate，导致选中框定位出错 ([feff617](https://github.com/Tencent/tmagic-editor/commit/feff6177c97851dbe5457d4d59222c3f045ce864))
* **stage:** 无法拖到left为0 ([069aec6](https://github.com/Tencent/tmagic-editor/commit/069aec64c152eca2a6b0508b787343aa9ceebcf6))
* 修正getScrollParent逻辑 ([#141](https://github.com/Tencent/tmagic-editor/issues/141)) ([f72b8c7](https://github.com/Tencent/tmagic-editor/commit/f72b8c7614135382bea9899a86b2ab1cb0db761b))
* 创建活动时 ([ac2aef9](https://github.com/Tencent/tmagic-editor/commit/ac2aef980c1bcc5a197b616df2480ad0b1964c93))
* 当前选中组件处于流式布局模式下时，直接拖动其他组件会错误判断成是流式组件 ([89f863d](https://github.com/Tencent/tmagic-editor/commit/89f863d873ed7e4c7a86138055a44351d77dfe32))


### Features

* **core:** 添加设计稿宽度设置(px转rem相关)，默认375，可设置为750 ([923e8ea](https://github.com/Tencent/tmagic-editor/commit/923e8ea5abcc10e46967a4f4d67d23d1965b0cf1))
* **docs:** 添加搜索 ([4e812c3](https://github.com/Tencent/tmagic-editor/commit/4e812c396de05286a990cfe8831b7cb20531b2e3))
* **editor:** 参考线缓存与页面绑定 ([fb612ea](https://github.com/Tencent/tmagic-editor/commit/fb612eaddc982ce885bfaaee4fc32e30f609d6c2))
* **editor:** 添加layer-panel/component-list-panel slot ([49c9e87](https://github.com/Tencent/tmagic-editor/commit/49c9e87d6e1c1491d71ce7c804c0d7ccdfad5b4b))
* **editor:** 添加props-panel-header slot;修改layer-panel,component-list-panel slot名称，加上-header ([e901ad4](https://github.com/Tencent/tmagic-editor/commit/e901ad4dd00d5e93b42721e4fed6f5ccdee5f8f9))
* **form:** datetime移出默认defaultTime，支持defaultTime配置 ([e1705c3](https://github.com/Tencent/tmagic-editor/commit/e1705c350e8fcd2b51ff35ec573ce08a6a307d3b))
* **form:** datetime默认的具体时刻设置为23：59:59 ([83cd101](https://github.com/Tencent/tmagic-editor/commit/83cd10159d87893d167f53f3a2218e0d18323df5))
* **form:** groundlist 函数配置增加prop/config两个变量 ([3de29e0](https://github.com/Tencent/tmagic-editor/commit/3de29e0316aa09db2e6876b0969af84b5b6c30ea))
* **playground:** 优化form/table playground ([c570370](https://github.com/Tencent/tmagic-editor/commit/c57037030d652ff160a108d632ff79b9bac97e2a))
* **playground:** 添加form、table playground入口 ([f808253](https://github.com/Tencent/tmagic-editor/commit/f80825331e373047d467bb189cc4e5857dac6dfa))
* **playground:** 添加不同设备切换 ([9f23cd6](https://github.com/Tencent/tmagic-editor/commit/9f23cd6361cce60c10178f39e133e13aa71a62ca))
* **runtime:** 支持构建magic-admin的runtime产物 ([014859f](https://github.com/Tencent/tmagic-editor/commit/014859fd2f590f63d0f52bbe95f06932ce0177b9))
* **stage:** 提供tmagicRuntimeReady message事件通知 ([def0e3e](https://github.com/Tencent/tmagic-editor/commit/def0e3ef8d3d3357d71be55dc3ca104b24fa527a))
* **ui-vue2:** 升级至vue2.7.4 ([f289388](https://github.com/Tencent/tmagic-editor/commit/f2893880b1859b7fa371220451ce5905391ba26d))
* **ui:** page 添加magic-ui-container class ([f3e2d9c](https://github.com/Tencent/tmagic-editor/commit/f3e2d9ca394d794183bccef26820020ea56da672))
* 支持将组件拖动到指定容器 ([de0c695](https://github.com/Tencent/tmagic-editor/commit/de0c6952c77fe8675c062f8237cd938531f22a82))
* 支持配置updateDragEl方法来调制选中框 ([154860c](https://github.com/Tencent/tmagic-editor/commit/154860c66c149b72537029b351401a0e90179e9c))



# [1.0.0-rc.7](https://github.com/Tencent/tmagic-editor/compare/1.0.0-beta.8...v1.0.0-rc.7) (2022-06-13)


### Bug Fixes

* **admin:** 管理端更新编辑器的使用方式 ([fe821f7](https://github.com/Tencent/tmagic-editor/commit/fe821f7d84b7a8907e588ecae1d82ceecf5634cc))
* **editor:** getLayout增加判断fixed ([8e004f9](https://github.com/Tencent/tmagic-editor/commit/8e004f9766761d0ef7bd3aeca947fc6197e321bc))
* **editor:** mac下meta + v,meta + x快捷键无效 ([76b8d23](https://github.com/Tencent/tmagic-editor/commit/76b8d2314ad8b8a0f02e045a4244a1be0635e79d))
* **editor:** root为空时异常处理 ([7d62c09](https://github.com/Tencent/tmagic-editor/commit/7d62c09c6b172cea95d8b120732b31c4c532fead))
* **editor:** ui-select样式优化 ([27a1ff8](https://github.com/Tencent/tmagic-editor/commit/27a1ff8527dacf63875c88e1bec2ca74076a43c0))
* **editor:** 从组件树选中没有渲染的组件时，需要等待组件渲染完成再初始化选中框 ([8390ba7](https://github.com/Tencent/tmagic-editor/commit/8390ba75be5b3aeff1e20b8a5d3d9ad1862a72ea))
* **editor:** 代码编辑器大小变化没有自适应大小 ([7dc5479](https://github.com/Tencent/tmagic-editor/commit/7dc54797d2b58a1b6d1053fa283ec9ccc5df498c))
* **editor:** 修复code 代码编辑器光标错乱问题 ([06b40c9](https://github.com/Tencent/tmagic-editor/commit/06b40c9c1559d56f5dccec6db4d5bf877b0a871b))
* **editor:** 修复fix布局的组件没有吸附效果问题 ([959638c](https://github.com/Tencent/tmagic-editor/commit/959638c2c5b7da0815940b50fbdb517dddfa56e9))
* **editor:** 修复pagebar文字超长换行问题 ([5350c90](https://github.com/Tencent/tmagic-editor/commit/5350c9050ceb40a222e5535805bf6703083b20e6))
* **editor:** 修复历史状态变化后，画布没有更新 ([bb5e192](https://github.com/Tencent/tmagic-editor/commit/bb5e192dcde9c064717c64b01cc1ad598112f371))
* **editor:** 修复新增组件时，组件列表配置的数据丢失问题 ([992ebbe](https://github.com/Tencent/tmagic-editor/commit/992ebbe3ce7db7a503518e3707a9d0e76164d428))
* **editor:** 修复浏览器快捷键 ([9addbdd](https://github.com/Tencent/tmagic-editor/commit/9addbddd636d8d187d1ea604148a67199348d823))
* **editor:** 修改pagebar过长无法滚动问题 ([9b849cc](https://github.com/Tencent/tmagic-editor/commit/9b849cc906db690d51a3bf02ec8cd52d888c94e1))
* **editor:** 切换组件时会连续触发两次表单初始化 ([3137350](https://github.com/Tencent/tmagic-editor/commit/31373500c27a16cfe0e7799a3dfce18616eb45b6))
* **editor:** 删除全部页面后显示异常 ([a0c3e25](https://github.com/Tencent/tmagic-editor/commit/a0c3e25edbb2096c83fa6cc6eb5c2ca1c0650cb6))
* **editor:** 删除的快捷键操作，不要对页面生效 ([9efe4f0](https://github.com/Tencent/tmagic-editor/commit/9efe4f04fc461d802fe1db82fda6120bc91800de))
* **editor:** 删除组件后，组件树不更新 ([bcbd1f5](https://github.com/Tencent/tmagic-editor/commit/bcbd1f5d376a0addc77d311ce117a18ff49ac565))
* **editor:** 右键菜单，mac触摸板上容易在菜单出现的时候触发当前鼠标位置的按钮 ([31cbe78](https://github.com/Tencent/tmagic-editor/commit/31cbe7818f2388929942a3e6377fbb41be4839b2))
* **editor:** 右键菜单粘贴的组件位置不对 ([26081ea](https://github.com/Tencent/tmagic-editor/commit/26081ea5cce0b18ccbe360259eae2f343021d753))
* **editor:** 右键菜单隐藏逻辑有问题 ([c99663a](https://github.com/Tencent/tmagic-editor/commit/c99663a3e8aa1730e3849d200dd9b441ef821c5a))
* **editor:** 在小屏幕下画布的标尺显示不全 ([1c8829f](https://github.com/Tencent/tmagic-editor/commit/1c8829fac9d99be36d80e543a15a11141de80832))
* **editor:** 复制组件后添加组件id一直是之前复制的组件的id ([6eb1f24](https://github.com/Tencent/tmagic-editor/commit/6eb1f2418a71fbdfb01834c90091911a23ba6862))
* **editor:** 复制页面，页面名称重新生成 ([c80dab8](https://github.com/Tencent/tmagic-editor/commit/c80dab835dd66e6ae294a1c6aab31146546b0343))
* **editor:** 新增service方法串行调用问题，解决连续快速拖动导致更新节点错乱问题 ([b8d352a](https://github.com/Tencent/tmagic-editor/commit/b8d352a885954e114e9071785676b6649a0dd691))
* **editor:** 新增页面不用添加历史记录 ([3dab16b](https://github.com/Tencent/tmagic-editor/commit/3dab16b2f6069bcba8153ffb21202e6218636f39))
* **editor:** 添加或者删除节点后，选中状态没有刷新 ([97fa34b](https://github.com/Tencent/tmagic-editor/commit/97fa34bbc68199bb4381a1a717ed0d2f98ab9899))
* **editor:** 添加组件默认添加到视窗中间，如果组件初始化height不是数值，则当0处理 ([663d7ce](https://github.com/Tencent/tmagic-editor/commit/663d7cee9ffd55da366b6189661f6f92b8c7a866))
* **editor:** 源代码编辑器保存快捷键阻止冒泡 ([2134d92](https://github.com/Tencent/tmagic-editor/commit/2134d92d5498d53472e978e29a618351f4410d50))
* **editor:** 由于有可选参数，所以将after hook的返回值放到第一个参数 ([9526c44](https://github.com/Tencent/tmagic-editor/commit/9526c44d1638d25d6ead686f926c80a67de2443f))
* **editor:** 组件列表中搜索栏层级问题 ([5e4b709](https://github.com/Tencent/tmagic-editor/commit/5e4b709d61dd06d2ee10a78b4b86d5be2b22ba1a))
* **editor:** 组件树右键菜单 ([8053394](https://github.com/Tencent/tmagic-editor/commit/805339422a9778fe7470334df4c8b4d963236c2f))
* **editor:** 组件树右键菜单子菜单出不来 ([be4df0f](https://github.com/Tencent/tmagic-editor/commit/be4df0fc9b8985ae7b9d6fd7a8d1402487790a12))
* **editor:** 组件树右键菜单添加组件无效 ([a320823](https://github.com/Tencent/tmagic-editor/commit/a3208239922b482189a0fd7cc86a35ae989d91fa))
* **editor:** 组件配置width为100%时，水平居中失效 ([4a19017](https://github.com/Tencent/tmagic-editor/commit/4a190176623e58095c6e323a10161b3be54b6e53))
* **editor:** 置顶,置低逻辑弄反了 ([586711b](https://github.com/Tencent/tmagic-editor/commit/586711b9bd19b2be5030a2b5302c13e946764b79))
* **form:** daterange 错误信息不会消除 ([a90777f](https://github.com/Tencent/tmagic-editor/commit/a90777f11a4e709c750e67d89762ef0239efe901))
* **form:** label width为0时隐藏label ([28d3ea0](https://github.com/Tencent/tmagic-editor/commit/28d3ea095903d647773effd419835686a75eb9a2))
* **form:** popper弹层字体大小仅在form size为small的时候设置为12px ([662a3d6](https://github.com/Tencent/tmagic-editor/commit/662a3d61ea3f8f8df42445a1c264b3c192afff07))
* **form:** row显隐不会触发 ([88cc033](https://github.com/Tencent/tmagic-editor/commit/88cc033e0d893d0c4357d3d9c7dd11a2a272a865))
* **form:** select group option key 出错导致页面卡死 [#67](https://github.com/Tencent/tmagic-editor/issues/67) ([054e836](https://github.com/Tencent/tmagic-editor/commit/054e83685997735098956b0b8f8cde269c3efcd9))
* **form:** tooltip丢失 ([2e12812](https://github.com/Tencent/tmagic-editor/commit/2e12812aace958fd8367578232a48680f4fccb2c))
* **form:** 修复select过滤本地数据出错 ([4d7b135](https://github.com/Tencent/tmagic-editor/commit/4d7b135e50ceb5d43d0edf0e5715a3fa76409d37))
* **form:** 修复text append按钮大小 ([59c0a09](https://github.com/Tencent/tmagic-editor/commit/59c0a090b87df34e6f0d7fdde44156efe689d7bb))
* **highlight:** 修复固定定位和弹窗场景下鼠标高亮偏移的问题 ([15b202a](https://github.com/Tencent/tmagic-editor/commit/15b202a9be73bbbb1f1cc67a2ce72de9717303ff))
* **playground:** 预览检查是否保存 ([f9ae10b](https://github.com/Tencent/tmagic-editor/commit/f9ae10bc9da091a18bd3032887931ac8b882dd3e))
* **runtime:** 修复window系统下npm run playground 出错问题 [#29](https://github.com/Tencent/tmagic-editor/issues/29) ([6df8ce8](https://github.com/Tencent/tmagic-editor/commit/6df8ce82a5675702f1e9b45c66696f5af85ef3d0))
* **runtime:** 编辑器中组件的样式不生效 fix [#109](https://github.com/Tencent/tmagic-editor/issues/109) ([46b2632](https://github.com/Tencent/tmagic-editor/commit/46b26328efcb8ffc4295fb648a55f0af551e2d93))
* **runtime:** 获取dsl字段出错 ([bb97c4c](https://github.com/Tencent/tmagic-editor/commit/bb97c4c6d0e0cc5f6ff617957096662f4e3878fd))
* **stage:** canSelect增加event参数 ([29a9912](https://github.com/Tencent/tmagic-editor/commit/29a99128203a34a67fd6963c007662f60f4c9a68))
* **stage:** import 了错误的log函数 ([038ef7c](https://github.com/Tencent/tmagic-editor/commit/038ef7cde467ccc80df9852b2e532d36365ccdb6))
* **stage:** 优化拖拽体验，当选中的节点变化时，重新创建moveable，如果没有变化则update状态 ([39dcd89](https://github.com/Tencent/tmagic-editor/commit/39dcd89acf8ed15fc965bd6678b5e7af21587177))
* **stage:** 修复添加组件后没有自动选中问题 ([0faabcb](https://github.com/Tencent/tmagic-editor/commit/0faabcb3ca0fdb2a1ed68e1aa783bdccc370645d))
* **stage:** 修复滚动容器大小发生变化时，导致滚动距离可能超出最大滚动值 ([f7ba716](https://github.com/Tencent/tmagic-editor/commit/f7ba716fe90cd554e1d6acd58b2856e18783c443))
* **stage:** 修复画布缩放后拖动鼠标漂移 ([759b264](https://github.com/Tencent/tmagic-editor/commit/759b26481d9ce960720627a68cd095d3087dc33b))
* **stage:** 修复鼠标移出画布后，highlight没有清除 ([9cb821c](https://github.com/Tencent/tmagic-editor/commit/9cb821c49183568ed54141746957733bc7f026f7))
* **stage:** 只有当组件不在视窗内才自动滚动，新增scrollIntoView配置 ([dbcd420](https://github.com/Tencent/tmagic-editor/commit/dbcd4201eaf90a688321f4ccd33ae7545bb578c2))
* **stage:** 流式布局下，镜像节点zindex应该比选中节点高 ([0824602](https://github.com/Tencent/tmagic-editor/commit/0824602ad2dc82e717c461bded5717856ebd72b3))
* **stage:** 页面小于画布时，滚动位置修复 ([8452daf](https://github.com/Tencent/tmagic-editor/commit/8452daf0e066c467b26fb6e3f0f35faa6cef00c7))
* **stage:** 页面高度比画布小时，滚动画布出现异常 ([94debf5](https://github.com/Tencent/tmagic-editor/commit/94debf51c0b4744e6129d47c4fa7f7878dfa255b))
* **table:** 修复table设置expand后多一列object的问题 ([57e8159](https://github.com/Tencent/tmagic-editor/commit/57e815940bb07b0971eaded9b371b8abacb8a52c))
* **ui:** default拼写错误 ([ce5ac67](https://github.com/Tencent/tmagic-editor/commit/ce5ac67b2ddb611dceeabf0d3d235f1b61423243))
* **ui:** img组件没有配置url是点击页面刷新 ([5d159ad](https://github.com/Tencent/tmagic-editor/commit/5d159ad9d8b7c1dc08ea186fbb96a76d2f9f9856))
* **uitls:** 添加package.json dependencies ([a7351c9](https://github.com/Tencent/tmagic-editor/commit/a7351c9a021b38d5fc378e44dd4f969e15b27879))
* **ui:** 页面组件无法支持event配置 ([cdabe36](https://github.com/Tencent/tmagic-editor/commit/cdabe36b9395b5b4c5e565919b5b7a3a74db8d05))
* **utils:** 判断是否为number不够严谨 ([2647ace](https://github.com/Tencent/tmagic-editor/commit/2647ace39639e248417be14b7ce9db7a2d077684))
* 修复lock文件问题 ([a1ae3dd](https://github.com/Tencent/tmagic-editor/commit/a1ae3dd88d7717ebed6afef428202f762079ca70))
* 修复node版本16安装依赖失败的问题 ([ec8867c](https://github.com/Tencent/tmagic-editor/commit/ec8867cbfd74d4bebc59a880cca7d0c2e8e8c62f))
* 修复throttle引起的问题 ([148d454](https://github.com/Tencent/tmagic-editor/commit/148d4547b0ff17628b0f5a3cc2f6fb3503460a10))
* 修复单独使用@tmagic/editor,报错无法运行的问题 ([582962f](https://github.com/Tencent/tmagic-editor/commit/582962f6df35279e08421e85066872638764e846))
* 修复快速点选拖动时有残影的问题 ([a52d25f](https://github.com/Tencent/tmagic-editor/commit/a52d25fb70172d02f88ded9070a3b26915e58a29))
* 修复组件树中hover不存在的id导致高亮边框不消失的问题 ([121498e](https://github.com/Tencent/tmagic-editor/commit/121498e81b72925b33d3fbfe913068ddd4480f6f))
* 修复缺少buffer依赖,导致单独使用@tmagic/editor出现报错,无法运行的问题 ([cb99a6f](https://github.com/Tencent/tmagic-editor/commit/cb99a6fff54ad5af622afbbc29f63c2c18f6f8ea))
* 修复页面滚动高亮偏移的问题 ([6a46f98](https://github.com/Tencent/tmagic-editor/commit/6a46f987666da3cf98c1855f6df5487aca505a3d))
* 删除无用的方法 ([4f4ed9c](https://github.com/Tencent/tmagic-editor/commit/4f4ed9c61bf40f13ac55bb6bb711891b2714fbb4))
* 升级element-plus2.2.0后,button默认样式变化 ([1486beb](https://github.com/Tencent/tmagic-editor/commit/1486beb52cf2553ebc026ed5941a8a865c483a96))
* 升级element-plus2.2.0后,sidebar动态变化后,顺序不对 ([2731609](https://github.com/Tencent/tmagic-editor/commit/2731609526d92093bfdccd660c96fbacc6f3d006))
* 管理端启动文档更新 ([86447ec](https://github.com/Tencent/tmagic-editor/commit/86447ec4a1ce1b1d69d13ef5aef2359c8e08e6bb))


### Features

* **editor): feat(editor:** 鼠标移出workpace，禁用快捷键 ([fbd7f80](https://github.com/Tencent/tmagic-editor/commit/fbd7f80c4f82122d61c9903e57c06b3fbdc6a3ef))
* **editor:** contentmenu支持扩展 ([70292b9](https://github.com/Tencent/tmagic-editor/commit/70292b92c8f9c04fa204ec50df80e831c5ee2bd5))
* **editor:** zoom 设置为button ([faa6c6d](https://github.com/Tencent/tmagic-editor/commit/faa6c6d9feb4881466f24192ef85d49334567698))
* **editor:** 修改默人属性面板宽度 ([ed9805f](https://github.com/Tencent/tmagic-editor/commit/ed9805f2b49429a176547dead0b811c9073a2116))
* **editor:** 增加editorService.move的扩展 ([b1aae65](https://github.com/Tencent/tmagic-editor/commit/b1aae6518254abfc8ff6f0183551652da101db4e))
* **editor:** 属性表单大小配置；记住编辑器分栏宽度 ([04d7725](https://github.com/Tencent/tmagic-editor/commit/04d7725db97aab9dfb6c9fae0333d1b07666e98c))
* **editor:** 支持拖拽添加组件 ([5da8601](https://github.com/Tencent/tmagic-editor/commit/5da8601f3648322882bbb562d3b45fed7f159361))
* **editor:** 新增删除、复制、粘贴、剪切快捷键操作 ([db62427](https://github.com/Tencent/tmagic-editor/commit/db62427ee96eeaa22d27cb2a1d01199c0b41ec54))
* **editor:** 新增组件自动设置到视窗中间 ([0e74970](https://github.com/Tencent/tmagic-editor/commit/0e74970bfef78d0e032c8a8bebaeedb9c141e26b))
* **editor:** 添加globalThis兼容 ([cf5e775](https://github.com/Tencent/tmagic-editor/commit/cf5e775b84fedca2fc870c74a2c709aa8dd284ea))
* **editor:** 添加常用快捷键 ([51031fe](https://github.com/Tencent/tmagic-editor/commit/51031fe8ab4396eb6785738b4f208f96a97627e0))
* **editor:** 源代码编辑器支持扩展配置 ([359fc5f](https://github.com/Tencent/tmagic-editor/commit/359fc5fdc68c5b312534ad4b76a2586baafae2dd))
* **editor:** 组件树保持展开当前选中节点的父节点 ([f896115](https://github.com/Tencent/tmagic-editor/commit/f89611588100e34461c833639742a297459f96e6))
* **editor:** 组件树增加id和type过滤 ([97a7225](https://github.com/Tencent/tmagic-editor/commit/97a722579d36db61e071eb50fd9ba72d4fce2262))
* **editor:** 选中组件，组件自动滚动到视窗内 ([50937c2](https://github.com/Tencent/tmagic-editor/commit/50937c286776794842b247b06f0751a3302a1cbf))
* **form:** number组件初始值尝试统一转换成number ([554bc4b](https://github.com/Tencent/tmagic-editor/commit/554bc4b5c10040e0ad4a834a32119bb7e63819a8))
* **form:** select options函数配置添加prop参数 ([7e216e7](https://github.com/Tencent/tmagic-editor/commit/7e216e72f234309bc1e99c9d0726bfec78c930de))
* **playground:** playground支持旋转操作 ([423059d](https://github.com/Tencent/tmagic-editor/commit/423059deacc3a958be8e099cbdc2b810f8691c86))
* **playground:** 增加字体样式配置 ([f7bca02](https://github.com/Tencent/tmagic-editor/commit/f7bca02844bb15a1bbf61156db0b2aada3fa6b5e))
* **playground:** 更新默认页面配置 ([5bfb69b](https://github.com/Tencent/tmagic-editor/commit/5bfb69b36dad2704be0c1c88b8332ddf3a282853))
* **playground:** 添加弹窗组合 ([2319df7](https://github.com/Tencent/tmagic-editor/commit/2319df727a7e0cf92641c2e512854306f20665f1))
* **schema:** type可以为undefined，默认表现由使用方自行控制 ([fe4c0fa](https://github.com/Tencent/tmagic-editor/commit/fe4c0fa2dc3642eff7b27057be4593253b470b68))
* **stage:** elementGuidelines可以配置 ([85164ec](https://github.com/Tencent/tmagic-editor/commit/85164ec43213cfb1b9ae2ac932f660f86e166e46))
* **stage:** moveable origin改为false ([fb64e07](https://github.com/Tencent/tmagic-editor/commit/fb64e078b95cdfff12f2762c3fa51413c21a2abe))
* **stage:** runtime添加getApp方法 ([0397c68](https://github.com/Tencent/tmagic-editor/commit/0397c6887a80f23e20c327aece640eef3f16ab73))
* **stage:** 增加对齐线 ([67e2ba3](https://github.com/Tencent/tmagic-editor/commit/67e2ba3825148282c2ba28df7fab06d3b2b9b102))
* **stage:** 增加当前拖动的节点的z-index ([7f3d6c5](https://github.com/Tencent/tmagic-editor/commit/7f3d6c5438bb0ab537b2c8d2eab1a129228e8f9c))
* **stage:** 支持rotate scale fix [#92](https://github.com/Tencent/tmagic-editor/issues/92) ([a9936b5](https://github.com/Tencent/tmagic-editor/commit/a9936b5276a2f5756791430036eb22d46a01cef3))
* **stage:** 本地缓存参考线，刷新页面不会清空 ([019cfc7](https://github.com/Tencent/tmagic-editor/commit/019cfc7e93dded2ac69ea53c891e97d888bb4c10))
* **stage:** 组件对齐不准确，暂时去掉 ([cb4304b](https://github.com/Tencent/tmagic-editor/commit/cb4304b6ebc2fda87b3dfa0bbe7135508f2ce74f))
* **stage:** 选中节点时，给所有父节点添加一个className ([d478289](https://github.com/Tencent/tmagic-editor/commit/d47828976a5dc3a3f46e84016e0e15b673aed278))
* **table:** action增加before配置 ([9126399](https://github.com/Tencent/tmagic-editor/commit/912639999d576c965315bb639ee8970bd4220cbd))
* **ui:** 添加二维码，图片组件 ([8c287ec](https://github.com/Tencent/tmagic-editor/commit/8c287ecaceba0e087a4cc7ff8ddb64613c0441e0))
* **util:** asyncLoadCss支持指定document ([71cfab8](https://github.com/Tencent/tmagic-editor/commit/71cfab8d4dd56b24a872d9c8dddf8a98672b36c5))
* 优化拖拽体验 ([a842c5b](https://github.com/Tencent/tmagic-editor/commit/a842c5b0ceecf2e1c1a8e2a5dc1ab8d3e486e0d6))
* 支持playground:vue2/playground:react命令 ([d84037e](https://github.com/Tencent/tmagic-editor/commit/d84037e421181b4f0866054e3dd08a569627c1c2)), closes [#82](https://github.com/Tencent/tmagic-editor/issues/82) [#68](https://github.com/Tencent/tmagic-editor/issues/68)
* 新增isPage,isNumber方法 ([9c83a54](https://github.com/Tencent/tmagic-editor/commit/9c83a540daf9fa6ad02e6d3832e218be5a4b555f))
* 新增蒙层组件 ([44aa56b](https://github.com/Tencent/tmagic-editor/commit/44aa56bd52c3ecc3b88f9b2e5b2283cb0a932fa1))
* 添加组件支持添加组合 ([5e31257](https://github.com/Tencent/tmagic-editor/commit/5e3125706c2919e0baf457141f69a9c70656ffcd))
* 编辑器支持鼠标悬停高亮组件 ([feb9ac9](https://github.com/Tencent/tmagic-editor/commit/feb9ac9a81a6805599da1d63697961c5dfbba953))



# [1.0.0-beta.8](https://github.com/Tencent/tmagic-editor/compare/1.0.0-beta.7...1.0.0-beta.8) (2022-03-29)


### Bug Fixes

* **editor:** 流式布局下，拖动后选中错误 ([393889b](https://github.com/Tencent/tmagic-editor/commit/393889b27a63bf0dd557e4d5b638de74545b1d43))
* **form:** onChange、filter、trim函数调用异常处理 ([504adcb](https://github.com/Tencent/tmagic-editor/commit/504adcb01793cb58d23a5d3cfb56da12a509de7f))
* **playground:** 新增页面默认width height 100% ([c3f4e41](https://github.com/Tencent/tmagic-editor/commit/c3f4e41cc864cd1e5c6486d34da79e4b684546c5))
* **stage:** drag的时候不update width height ([30ad850](https://github.com/Tencent/tmagic-editor/commit/30ad8502c4a1e2925afc22297e7c5ac3a8e03378))
* **stage:** render destroy后移除load事件 ([f03281a](https://github.com/Tencent/tmagic-editor/commit/f03281ac6cddd6742841f67d484eb5fca0871c4a))
* **stage:** 混合布局下拖动错乱 ([8e2d83f](https://github.com/Tencent/tmagic-editor/commit/8e2d83fec9e8b4871cee066b641e3441eddb619a))
* **stage:** 这有overflow为auto或scroll才在选中的时候设置为hidden ([8619af9](https://github.com/Tencent/tmagic-editor/commit/8619af91db25aef36e65f9c0ab8df307e7b101f4))
* **stage:** 页面默认滚动容器设置为documentElement ([4560562](https://github.com/Tencent/tmagic-editor/commit/45605625535c1aa648eae275639b8a642ff4ec3b))


### Features

* 新增select下的popper class ([8e192e7](https://github.com/Tencent/tmagic-editor/commit/8e192e7cd42df56b94f8f1093a00b6f72b41505e))


### Reverts

* Revert "Revert "refactor(stage): 升级moveable"" ([6becbda](https://github.com/Tencent/tmagic-editor/commit/6becbdaa6b6dacc453207a2bc11ce33a5190d313))



# [1.0.0-beta.7](https://github.com/Tencent/tmagic-editor/compare/1.0.0-beta.6...1.0.0-beta.7) (2022-03-18)


### Bug Fixes

* **editor:** 切换布局失效 ([42f1789](https://github.com/Tencent/tmagic-editor/commit/42f1789c1059d9e400dc327bcbfabb5807ebed97))


### Reverts

* Revert "refactor(stage): 升级moveable" ([10ed55d](https://github.com/Tencent/tmagic-editor/commit/10ed55deea0c3dc7a97ac136a4065c447aaaf52a))



# [1.0.0-beta.6](https://github.com/Tencent/tmagic-editor/compare/v1.0.0-beta.4...1.0.0-beta.6) (2022-03-17)


### Bug Fixes

* **editor:** 不允许选中跟节点 ([ca84c8f](https://github.com/Tencent/tmagic-editor/commit/ca84c8f852a69839ddcba0d92700f36b07f76be7))
* **editor:** 样式优化调整 ([12de0f5](https://github.com/Tencent/tmagic-editor/commit/12de0f541442cde8651d71982df26d39727cbd56))
* **editor:** 画布拖动容易误触 ([541a279](https://github.com/Tencent/tmagic-editor/commit/541a279fe7eda0f11c2e71a2eaf66ca19b27c66f))
* **editor:** 首次选中组件后拖动,更新节点无效 ([dee685f](https://github.com/Tencent/tmagic-editor/commit/dee685f0b33b0c44fdcfac5514a944be6731771d))
* **stage:** 修复触摸板轻触移动时拖动左键;隐藏标尺后,改变画布大小,再显示标尺,标尺变形 ([edbb552](https://github.com/Tencent/tmagic-editor/commit/edbb5521b321bc28c0504af8f86046bed893588f))



# [1.0.0-beta.4](https://github.com/Tencent/tmagic-editor/compare/3419f800ef0865a2c6d6a453143c48df5d250a24...v1.0.0-beta.4) (2022-03-14)


### Bug Fixes

* **editor:** 更新根节点出错 ([412c781](https://github.com/Tencent/tmagic-editor/commit/412c78153cc640f0c46a06314e47f66055516106))
* **form:** 优化table样式 ([3c7d756](https://github.com/Tencent/tmagic-editor/commit/3c7d756d19eff774fec5a96c1177f7c1c9095554))
* **form:** 表单配置没有变化,初始值变化时,表单发生重绘 ([979336c](https://github.com/Tencent/tmagic-editor/commit/979336c05254783225f4fc5681ef407489c41e67))
* 更新elemnt-plus2.0.2后,size的值变了,去掉Form下size prop的默认值,增加Formdialog size prop ([3419f80](https://github.com/Tencent/tmagic-editor/commit/3419f800ef0865a2c6d6a453143c48df5d250a24))
* 构建的文件名与package.json中的不匹配 ([4f4e81f](https://github.com/Tencent/tmagic-editor/commit/4f4e81f27cd48099106ca0baa15109cc22941122))


### Features

* **editor:** 画布拖动 ([de9d7d3](https://github.com/Tencent/tmagic-editor/commit/de9d7d340a62ae94f852a68f6400b5f2a690c8da))
* **editor:** 画布自适应大小 ([ab3e113](https://github.com/Tencent/tmagic-editor/commit/ab3e113904b5d0601b7a382011cbdbb8f027f6c3))
* 新增管理端demo代码 ([2bfb85b](https://github.com/Tencent/tmagic-editor/commit/2bfb85bdbfc7870b0caaf03f5aa3644a2c95b9aa))



