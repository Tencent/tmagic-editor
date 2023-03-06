## [1.2.8](https://github.com/Tencent/tmagic-editor/compare/v1.2.7...v1.2.8) (2023-03-06)


### Bug Fixes

* **editor,ui,ui-vue2,ui-react:** 页面配置更新后，蒙层无法显示 ([c025508](https://github.com/Tencent/tmagic-editor/commit/c025508cd79009e757b73a190cbb201cd44b3edf)), closes [#472](https://github.com/Tencent/tmagic-editor/issues/472)
* **editor:** 更新组件后，组件树选中状态被重置 ([e0c0143](https://github.com/Tencent/tmagic-editor/commit/e0c014397056bcddf82acd063288d3d045bd2dc5))
* **editor:** 组件树切换选择组件可能触发多选 ([b8cda53](https://github.com/Tencent/tmagic-editor/commit/b8cda53d6a9af8c06d4f8670289d2a6c9eadfe5c))


### Features

* **stage:** 支持多选组件并将多个组件拖入指定容器中 ([449efcc](https://github.com/Tencent/tmagic-editor/commit/449efcc56b0cee6898ff439ff441a8a67a1a143c)), closes [#405](https://github.com/Tencent/tmagic-editor/issues/405)



## [1.2.7](https://github.com/Tencent/tmagic-editor/compare/v1.2.6...v1.2.7) (2023-03-02)


### Bug Fixes

* **design:** element-plus@2.2.22开始scrollbar.wrap$改成wrapRef ([62038c8](https://github.com/Tencent/tmagic-editor/commit/62038c8c601f4143ea8812f4d77782c6dac69df0))
* **stage:** 选择父组件的able功能丢失 ([b4bee9e](https://github.com/Tencent/tmagic-editor/commit/b4bee9eb82b5367d8a6e1960b5bab02ab8f6f8e3))


### Features

* **cli:** cli返回app ([c41af9d](https://github.com/Tencent/tmagic-editor/commit/c41af9d01d3746d218e3f71166c54eb2a9476fe2))
* **form:** 支持表单差异对比 ([6610f30](https://github.com/Tencent/tmagic-editor/commit/6610f30afd84fce9a989f49eb2de8a9b8eee745a))
* **stage,editor:** 增肌删除快捷按钮 ([c9bacb9](https://github.com/Tencent/tmagic-editor/commit/c9bacb96cddfc69b737a8ecb058f5479ba8240b7))



## [1.2.6](https://github.com/Tencent/tmagic-editor/compare/v1.2.5...v1.2.6) (2023-02-21)


### Bug Fixes

* **form:** select下拉列表分页不生效问题 ([8edf023](https://github.com/Tencent/tmagic-editor/commit/8edf023a0014747758b193c411b285baa11f05de))



## [1.2.5](https://github.com/Tencent/tmagic-editor/compare/v1.2.4...v1.2.5) (2023-02-17)


### Bug Fixes

* **editor:** 修复优化性能引起的问题,支持回退撤销对代码关系的更新 ([0109181](https://github.com/Tencent/tmagic-editor/commit/010918198a7daa97ed3bd3c797ac88c091ef90a1))



## [1.2.4](https://github.com/Tencent/tmagic-editor/compare/v1.2.3...v1.2.4) (2023-02-17)


### Bug Fixes

* 调整绑定关系结构,优化性能  ([a013f35](https://github.com/Tencent/tmagic-editor/commit/a013f35cd9bd5bb9b3f3c796d603c9efc31d5b5d))



## [1.2.3](https://github.com/Tencent/tmagic-editor/compare/v1.2.2...v1.2.3) (2023-02-15)


### Features

* **cli:** 支持配置是否自动安装组件npm包，支持配置安装组件npm包后是否保持package.json不变 ([d06a874](https://github.com/Tencent/tmagic-editor/commit/d06a874c3b997a73f80bed4196974a331d6ef133))
* **form:** select config.option.afterRequest添加postOptions ([4d0b4c3](https://github.com/Tencent/tmagic-editor/commit/4d0b4c31781e5a3381fc4d73bf62c6f66253a563))



## [1.2.2](https://github.com/Tencent/tmagic-editor/compare/v1.2.1...v1.2.2) (2023-02-09)


### Bug Fixes

* **editor:** set root 可能没有items ([aa566e9](https://github.com/Tencent/tmagic-editor/commit/aa566e9535c5afd76fa15b39f42de395758189eb))



## [1.2.1](https://github.com/Tencent/tmagic-editor/compare/v1.2.0...v1.2.1) (2023-02-09)


### Bug Fixes

* **editor:** 新增的组件如果没有初始化left值,会导致无法通过键盘方向键左右移动 ([3b30d89](https://github.com/Tencent/tmagic-editor/commit/3b30d89956717d686046876156c3571f35c0036f)), closes [#468](https://github.com/Tencent/tmagic-editor/issues/468)
* **editor:** 编辑器中间列宽度出现负值 ([a6226cb](https://github.com/Tencent/tmagic-editor/commit/a6226cba188ca107919237c4d92c0f19c33e77fe))


### Features

* **admin:** 使用@tmagic/table重构活动列表 ([8fa1d4a](https://github.com/Tencent/tmagic-editor/commit/8fa1d4a5c3294df6449eb15ef9181717416e3dc4))
* **cli:** export allowTs函数 ([bf547fe](https://github.com/Tencent/tmagic-editor/commit/bf547fe1a06239d6703d1887f86fa47f0ee66232))
* **editor,form,schema:** 优化代码 ([0b537f5](https://github.com/Tencent/tmagic-editor/commit/0b537f5bff3466fff2a6cfb5ed37811b28968066))
* **editor:** 修改service get set 方法的ts定义，不再需要传入泛型参数 ([0491487](https://github.com/Tencent/tmagic-editor/commit/0491487385257642e0c5e246831f2158175ca532))
* **util:** 修改isPage函数定义 ([b9d4e8c](https://github.com/Tencent/tmagic-editor/commit/b9d4e8c66c2b0c3fc8085d1ee23ed4f0739ed3cb))



# [1.2.0](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.27...v1.2.0) (2022-12-22)


### Bug Fixes

* **editor:** 代码块列表无法滚动 ([87a19c9](https://github.com/Tencent/tmagic-editor/commit/87a19c9bae4dc0d88c6bb2c9d164db6198e8f6ee))



# [1.2.0-beta.27](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.26...v1.2.0-beta.27) (2022-12-13)


### Bug Fixes

* **editor:** 组件销毁时移除service的时间监听 ([cfc57f1](https://github.com/Tencent/tmagic-editor/commit/cfc57f17af8c7b32ca31056570aa422219963d04))



# [1.2.0-beta.26](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.25...v1.2.0-beta.26) (2022-12-12)


### Bug Fixes

* **editor:** 粘贴的组件为当前选中组件的副本时，则添加到当前选中组件的父组件中 ([3dcdc04](https://github.com/Tencent/tmagic-editor/commit/3dcdc04127362fae1a5a291b7950ddd44b79a7ad)), closes [#448](https://github.com/Tencent/tmagic-editor/issues/448)


### Features

* **design:** 添加class ([ffb84cf](https://github.com/Tencent/tmagic-editor/commit/ffb84cffca8afda45bc153e467a926cf1ec5c0be))
* **stage,editor:** 添加disabledDragStart配置,用于关闭按下鼠标并拖动功能 ([dd8ac99](https://github.com/Tencent/tmagic-editor/commit/dd8ac99d5d20a019c1a18f445d77bb9075c831d9))
* **tdesign-vue-next-adapter:** 新增tdesign设配器 ([c3888be](https://github.com/Tencent/tmagic-editor/commit/c3888bedf229c025b41f97c307771493e84839b9))



# [1.2.0-beta.25](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.24...v1.2.0-beta.25) (2022-12-07)


### Bug Fixes

* **cli:** 异步组件返回应该是个函数 ([138614a](https://github.com/Tencent/tmagic-editor/commit/138614a57adaf11b46b86f95c70df00975903c7b))
* **cli:** 插件不支持ts的问题 ([ccb4e67](https://github.com/Tencent/tmagic-editor/commit/ccb4e675ab8e33cafb5374f9db4c602c380ccc31))
* **playground:** 加载组件表单配置资源失败 ([ba20eb8](https://github.com/Tencent/tmagic-editor/commit/ba20eb8cf1aebc735d75c6fb2f3023f0c61b8360))



# [1.2.0-beta.24](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.23...v1.2.0-beta.24) (2022-12-07)


### Bug Fixes

* **form:** disable配置失效 ([12d56ae](https://github.com/Tencent/tmagic-editor/commit/12d56aeda9197dfc31bf5b7e8fe480deca4a85f1))



# [1.2.0-beta.23](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.22...v1.2.0-beta.23) (2022-12-07)


### Bug Fixes

* **editor:** modelValue自动更新不成功 ([e813129](https://github.com/Tencent/tmagic-editor/commit/e813129eb8ea6e11e683c081847dd17fb1104dfd))


### Features

* **form:** 完善select remote功能 ([7445d24](https://github.com/Tencent/tmagic-editor/commit/7445d2453194258256c70d4936aa43d04dfecdb2))



# [1.2.0-beta.22](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.21...v1.2.0-beta.22) (2022-12-06)



# [1.2.0-beta.21](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.20...v1.2.0-beta.21) (2022-12-06)


### Bug Fixes

* **editor:** layout 组件中hasRight判断出错 ([f6dca97](https://github.com/Tencent/tmagic-editor/commit/f6dca97442339f1cc941ebaf39eddbe657f76512))
* **editor:** services在组件unmounted时只重置状态不移除事件 ([45a20d9](https://github.com/Tencent/tmagic-editor/commit/45a20d9405900c62dfc1c3b82612c69c409da373))


### Features

* **editor:** 新增可以移除所有service插件的方法 ([67c7faf](https://github.com/Tencent/tmagic-editor/commit/67c7faf832c811866f6c012a7362472397fdc6ef))



# [1.2.0-beta.20](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.19...v1.2.0-beta.20) (2022-12-05)


### Bug Fixes

* **editor:** 复制粘贴时添加的到的父组件应当是当前父组件 ([828681e](https://github.com/Tencent/tmagic-editor/commit/828681e9608629414811d49da7ba3a3100e82ccd)), closes [#448](https://github.com/Tencent/tmagic-editor/issues/448)
* **editor:** 编辑器初始化默认选择节点 ([45eaea6](https://github.com/Tencent/tmagic-editor/commit/45eaea6f686d81d04c92bbed42a3a0092b7228d8))



# [1.2.0-beta.19](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.18...v1.2.0-beta.19) (2022-12-01)


### Bug Fixes

* **editor:** 页面切换不在重新渲染画布 ([b7934f9](https://github.com/Tencent/tmagic-editor/commit/b7934f9f5108a72ea7224b573e0bbb3722983b64))


### Features

* **editor:** history增加page-change事件 ([830c8d8](https://github.com/Tencent/tmagic-editor/commit/830c8d8747cd23e3dbce90d60a9dc0ac1e53662d))
* **form:** dialog支持disabled配置 ([239b5d3](https://github.com/Tencent/tmagic-editor/commit/239b5d3efeae916a8cf3e3566d88063ecccc0553))
* **form:** table支持rowkey配置 ([ea8b863](https://github.com/Tencent/tmagic-editor/commit/ea8b8636944f37941ebffa8866074d310cf32918))


### Reverts

* Revert "chore: github文档构建锁定在v1.1.6版本" ([c143a5f](https://github.com/Tencent/tmagic-editor/commit/c143a5f7670ae61d80c1a2cfcc780cfb5259849d))



# [1.2.0-beta.18](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.17...v1.2.0-beta.18) (2022-11-24)


### Bug Fixes

* **editor:** itemsFunction中补全value ([e497ab0](https://github.com/Tencent/tmagic-editor/commit/e497ab00085e1098842024cbd9df50ec566254a9))


### Features

* **cli:** export loadUserConfig ([d46d611](https://github.com/Tencent/tmagic-editor/commit/d46d61184bdbe6628f172cde92a2327ce3f2485f))



# [1.2.0-beta.17](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.16...v1.2.0-beta.17) (2022-11-24)


### Bug Fixes

* **editor:** m-form不能加key，会导致vue示例销毁重建 ([fc50c87](https://github.com/Tencent/tmagic-editor/commit/fc50c87ad51733b16751f4b2b6b0d5f3e9d342e8))



# [1.2.0-beta.16](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.15...v1.2.0-beta.16) (2022-11-23)


### Bug Fixes

* **design:** tabs支持modelValue ([47e851c](https://github.com/Tencent/tmagic-editor/commit/47e851ce5e1e9a60672b3854229552ff24989188))
* **editor:** 切换选中组件后组件属性表单内存未释放 ([eacc4dc](https://github.com/Tencent/tmagic-editor/commit/eacc4dc7942ab38b4e36ee851cc7e19a3a6bb10b)), closes [#123](https://github.com/Tencent/tmagic-editor/issues/123)
* 在tree上增加tabindex来监听focus事件,完善组件树多选体验 ([5ae32f0](https://github.com/Tencent/tmagic-editor/commit/5ae32f0792e90319b1e546f72dfba174615307c6))



# [1.2.0-beta.15](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.14...v1.2.0-beta.15) (2022-11-22)


### Bug Fixes

* **editor:** 修复setCodeDslById不传content引起的问题 ([13dc3ca](https://github.com/Tencent/tmagic-editor/commit/13dc3ca25936cb074f70c6a94591b5e0226fe68c))


### Features

* **editor:** 修改代码块参数结构,以对象形式暴露app,params ([8195a60](https://github.com/Tencent/tmagic-editor/commit/8195a600f52f478e0db386fe32b8819fca6d8852))



# [1.2.0-beta.14](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.13...v1.2.0-beta.14) (2022-11-18)


### Bug Fixes

* **editor:** 编辑器左中右列宽支持配置最小宽度 ([bddfcee](https://github.com/Tencent/tmagic-editor/commit/bddfcee92b968b09875c43a9035bf9b7817396e3))


### Features

* **cli:** useTs 为必填参数 ([bb5aa67](https://github.com/Tencent/tmagic-editor/commit/bb5aa6722f4b1a30034ad96edadadd0bb6575848))
* **cli:** 增加 useTs 配置 ([b512e14](https://github.com/Tencent/tmagic-editor/commit/b512e141293746871f760895a79f092242e1a0be))
* **editor:** 代码编辑支持全屏 ([8271a3b](https://github.com/Tencent/tmagic-editor/commit/8271a3b497ac3aadb79364e0eebc912ce7b3304f))
* **editor:** 添加右键菜单粘贴icon ([813ca55](https://github.com/Tencent/tmagic-editor/commit/813ca55ef6831ce3505ff2b4c9269eab04aad7f8))
* **table:** expand内容支持vue组件 ([aa9293a](https://github.com/Tencent/tmagic-editor/commit/aa9293af55475948252acc078695594a320e8839))



# [1.2.0-beta.13](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.12...v1.2.0-beta.13) (2022-11-15)


### Bug Fixes

* **form:** time value改成HH:mm:ss字符串,支持配置 ([4fe45eb](https://github.com/Tencent/tmagic-editor/commit/4fe45eb36df988bbcb972b7599d62f2f9a3d3276))



# [1.2.0-beta.12](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.11...v1.2.0-beta.12) (2022-11-15)


### Bug Fixes

* **cli:** entry生成路径错误问题 ([f5a8d6b](https://github.com/Tencent/tmagic-editor/commit/f5a8d6bdc6e490fbe45fa3472cb6430562d407ab))
* **editor:** 修复自动保存提示不展示的问 ([0f0ec18](https://github.com/Tencent/tmagic-editor/commit/0f0ec183a869f8530fc39f9cfd533640d707ca98)), closes [#440](https://github.com/Tencent/tmagic-editor/issues/440)
* **editor:** 区分直接关闭和保存后关闭 ([0eab817](https://github.com/Tencent/tmagic-editor/commit/0eab817a1132561383b545c13c8c90c31f58d5b7)), closes [#440](https://github.com/Tencent/tmagic-editor/issues/440)
* **editor:** 新增删除页面不应该添加历史 ([3e78a08](https://github.com/Tencent/tmagic-editor/commit/3e78a0809b776081d6f56076770e3b8acba0e993))
* 代码块结构改造完成 ([c7a8552](https://github.com/Tencent/tmagic-editor/commit/c7a8552d9b9de6709b5a36070cbcbcd2739c02ed))
* 优化组件列表多选键盘快捷键监听体验 ([b2702aa](https://github.com/Tencent/tmagic-editor/commit/b2702aaa9e3a74194626dee5599a444dd402e154))


### Features

* **cli:** ast 解析入口文件优化 ([04e1857](https://github.com/Tencent/tmagic-editor/commit/04e18572fd6cd76b80610d4c7b1cf05cf40eaabd))
* **cli:** hooks.beforeWriteEntry 改为 async ([cc21c47](https://github.com/Tencent/tmagic-editor/commit/cc21c47829e59be85270b325b884dbcf21d3d83e))
* **cli:** 优化 logger，优化 ast 解析 ([958bcd3](https://github.com/Tencent/tmagic-editor/commit/958bcd3ec5fc964532e13bb623a5ac36f898915c))
* **cli:** 增加 hook.beforeWriteEntry ([4c94fa0](https://github.com/Tencent/tmagic-editor/commit/4c94fa0a8fa0cbb9618017709bd2479629d4ac52))
* **cli:** 文件声明“不合法”修改为“缺失” ([6c5cc55](https://github.com/Tencent/tmagic-editor/commit/6c5cc55f31d7c6b3872a64cf464a53799efd757f))
* **cli:** 设置 dynamicImport 时生成 async-plugin-entry ([258ac4d](https://github.com/Tencent/tmagic-editor/commit/258ac4d56b1da3bf8b2e0fcd1c6189a13efc7793))
* core代码执行兼容老的数据格式 ([a03ac7c](https://github.com/Tencent/tmagic-editor/commit/a03ac7c78b3b0a15ebb3744593ee40769d6e126d))
* **editor:** 代码块支持传递参数 (merge request !9) ([16f671c](https://github.com/Tencent/tmagic-editor/commit/16f671cd8fa0a077a1b00ac374635671412804b3))
* **editor:** 代码编辑新增草稿功能 ([3673d60](https://github.com/Tencent/tmagic-editor/commit/3673d6016de1289104dd39c77c7f7bbd705f42a0)), closes [#440](https://github.com/Tencent/tmagic-editor/issues/440)
* **editor:** 拆分代码块编辑器便于以后扩展,支持草稿自动保存,修复代码块列表的样式问题 ([d98d374](https://github.com/Tencent/tmagic-editor/commit/d98d3748d36e3a87e726a27a6f2d851b0c26bf75)), closes [#440](https://github.com/Tencent/tmagic-editor/issues/440)
* **table:** 支持expand内容可以为html ([f824b66](https://github.com/Tencent/tmagic-editor/commit/f824b661bd897eefce567691c7f3ac55046246de))
* 修改code_block结构,组件代码关系绑定改为table,绑定关系更新未完成 ([c4293f1](https://github.com/Tencent/tmagic-editor/commit/c4293f17a679015277a4547cae2bf391f10b9fda))



# [1.2.0-beta.11](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.10...v1.2.0-beta.11) (2022-11-08)


### Bug Fixes

* **editor:** Layout 组件与Layout ts type 重名，将组件改为LayoutContainer ([eae7769](https://github.com/Tencent/tmagic-editor/commit/eae776990cd8e8df6492b6a3ab89a6ee26edc617))



# [1.2.0-beta.10](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.9...v1.2.0-beta.10) (2022-11-07)


### Bug Fixes

* **editor:** content-menu没有响应式 ([c2e8a1c](https://github.com/Tencent/tmagic-editor/commit/c2e8a1caae210993366e1234613fc78e606ce36b))
* **editor:** 单选水平居中 ([e8c53c2](https://github.com/Tencent/tmagic-editor/commit/e8c53c2bd1bb3c0f32745fcdd840a7faaa61e07b))
* **editor:** 多选后，再单选多选中的第一个元素，多选状态没有清除 ([66e7278](https://github.com/Tencent/tmagic-editor/commit/66e727838b9306112a38b000b3675b4cdfc8db8a))
* **editor:** 画布滚动条出现的不准确 ([8d8ef55](https://github.com/Tencent/tmagic-editor/commit/8d8ef55b81ecbfe8b1fa2a8ee738c7b4952369c1))
* **form:** table 分页 ([929d7c4](https://github.com/Tencent/tmagic-editor/commit/929d7c463f2880a59deef2ec4d377868bd27d9cc))
* **form:** table 拖动排序 ([617b025](https://github.com/Tencent/tmagic-editor/commit/617b025ce13b87c11292db39d741cf769cbcbc9d))



# [1.2.0-beta.9](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.8...v1.2.0-beta.9) (2022-10-28)


### Bug Fixes

* **editor:** content-menu隐藏时不销毁 ([723da40](https://github.com/Tencent/tmagic-editor/commit/723da40bc7d0830610378efc8b540edaaf7e468d))
* **editor:** 优化代码逻辑 ([f8d7eae](https://github.com/Tencent/tmagic-editor/commit/f8d7eaea5ed13b2d7a8978c212705bbd130e9d3b))
* **form:** formState需要同步props更新 ([49c0ec9](https://github.com/Tencent/tmagic-editor/commit/49c0ec9dd9289723f39037e47a58eed598135e2c))
* 使用form.initValues解决代码块绑定关系更新不及时的问题 ([0ca0abf](https://github.com/Tencent/tmagic-editor/commit/0ca0abf2da4cf835c20c661cd773955350fa830d))


### Features

* **form:** 展开更多支持配置函数 ([9fd8385](https://github.com/Tencent/tmagic-editor/commit/9fd8385651c895208a47eb621340a798fe3a4c93))



# [1.2.0-beta.8](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.7...v1.2.0-beta.8) (2022-10-25)


### Bug Fixes

* **editor:** 修复管理端和pg表现不一致的问题,删除冗余逻辑 ([bc0f17c](https://github.com/Tencent/tmagic-editor/commit/bc0f17c18fe828faabfd6e4b027f5b75b9f1a034))
* **stage:** 修复辅助线显隐的bug ([f416530](https://github.com/Tencent/tmagic-editor/commit/f416530d382ee48678d26fdcd58a6ee9426be865)), closes [#444](https://github.com/Tencent/tmagic-editor/issues/444)


### Features

* **editor,stage:** 在画布中支持选择父组件 ([11e0e04](https://github.com/Tencent/tmagic-editor/commit/11e0e04cbdf3bcde2ea3fdbe113cba0a91406f53)), closes [#403](https://github.com/Tencent/tmagic-editor/issues/403)
* **form:** formDialog支持zIndex props ([f6b7e8d](https://github.com/Tencent/tmagic-editor/commit/f6b7e8dad8a012a5446f35fcb5c1e9c744af05b8))
* **table:** action 支持icon，text支持函数 ([a065552](https://github.com/Tencent/tmagic-editor/commit/a06555268fb26c734aca4343c80deb1617f6bd45))



# [1.2.0-beta.7](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.6...v1.2.0-beta.7) (2022-10-17)


### Bug Fixes

* **design:** input slot 出错 ([d2eaecf](https://github.com/Tencent/tmagic-editor/commit/d2eaecfaab8cdbdd22322c45356e680ac45f30d6))
* **element-plus-adapter:** tag组件写成了tabs ([b965e66](https://github.com/Tencent/tmagic-editor/commit/b965e66440687de235e267c745c10ba9b5d6b32e))



# [1.2.0-beta.6](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.4...v1.2.0-beta.6) (2022-10-14)


### Bug Fixes

* **design:** tag组件获取适配组件出错 ([4369191](https://github.com/Tencent/tmagic-editor/commit/43691911b798e59ee2feb319fdb6f896cb6578d0))
* **editor:** 列框缓存失效 ([e01d5d9](https://github.com/Tencent/tmagic-editor/commit/e01d5d913fb16f7e615d7c352b73c8df660652fe))
* **editor:** 多选后拖动，组件树会收缩 ([4041029](https://github.com/Tencent/tmagic-editor/commit/40410292d73c38525c2f20da5ab6a75302e5a171))
* **editor:** 拖动改变左右列宽，不能让中间区域宽度小于0 ([0444f68](https://github.com/Tencent/tmagic-editor/commit/0444f68f3a34615b5cb5d978fdec9d959d8d8a3b))
* **editor:** 设置高亮节点操作一定要在刷新展开状态之后，否则可能导致设置的高亮无效 ([2c31caf](https://github.com/Tencent/tmagic-editor/commit/2c31caf34f740470a313314112798f7aae2a020c)), closes [#404](https://github.com/Tencent/tmagic-editor/issues/404)
* **table:** type 为selection只能是table下的children，不能是children的children ([a6ecbb6](https://github.com/Tencent/tmagic-editor/commit/a6ecbb66d1808ece12fd299f0e73577eb2cc5f68))



# [1.2.0-beta.5](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.4...v1.2.0-beta.5) (2022-10-12)


### Bug Fixes

* **design:** tag组件获取适配组件出错 ([4369191](https://github.com/Tencent/tmagic-editor/commit/43691911b798e59ee2feb319fdb6f896cb6578d0))
* **editor:** 列框缓存失效 ([e01d5d9](https://github.com/Tencent/tmagic-editor/commit/e01d5d913fb16f7e615d7c352b73c8df660652fe))
* **editor:** 拖动改变左右列宽，不能让中间区域宽度小于0 ([0444f68](https://github.com/Tencent/tmagic-editor/commit/0444f68f3a34615b5cb5d978fdec9d959d8d8a3b))



# [1.2.0-beta.4](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.3...v1.2.0-beta.4) (2022-10-12)



# [1.2.0-beta.3](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.2...v1.2.0-beta.3) (2022-10-12)


### Bug Fixes

* **stage:** 页面布局修改为流式布局后，组件宽可以设置到边框之外 ([b77cf10](https://github.com/Tencent/tmagic-editor/commit/b77cf108cd28d6d941d389f2a59462716c6d4207)), closes [#395](https://github.com/Tencent/tmagic-editor/issues/395)


### Features

* **design:** 新增TMagicDesign，用于适配不同的ui框架 ([e2d7841](https://github.com/Tencent/tmagic-editor/commit/e2d784176b48cff33518328f23b155a0128bbf1d)), closes [#401](https://github.com/Tencent/tmagic-editor/issues/401)
* **design:** 默认使用element-plus ([476e715](https://github.com/Tencent/tmagic-editor/commit/476e715982597cd56e5ff58e2adf44198e81903f))
* **editor:** editor使用tmagic-design ([63c61ca](https://github.com/Tencent/tmagic-editor/commit/63c61caccc99873868f02ccf7875ae6f1ce1d4a8)), closes [#401](https://github.com/Tencent/tmagic-editor/issues/401)
* **editor:** 支持通过左侧组件树进行组件多选 ([e3b7f58](https://github.com/Tencent/tmagic-editor/commit/e3b7f587ee002f730e2e1b592f56d07f21de92bb)), closes [#404](https://github.com/Tencent/tmagic-editor/issues/404)
* **element-plus-adapter:** 新增element-plus ui适配器 ([c613b12](https://github.com/Tencent/tmagic-editor/commit/c613b12f110dc4b46f4343cda75149543bc0c82c)), closes [#401](https://github.com/Tencent/tmagic-editor/issues/401)
* **form:** checkboxGroup options支持函数配置 ([6d432ba](https://github.com/Tencent/tmagic-editor/commit/6d432ba1da4783607bbbfc22bed50433a90f0fa6))
* **form:** 剥离element-plus依赖，使用tamgic-design ([3a1a979](https://github.com/Tencent/tmagic-editor/commit/3a1a9795f6335533d914098e7c46dae1258681f3)), closes [#401](https://github.com/Tencent/tmagic-editor/issues/401)
* **playground:** 使用@tamgic/design ([36f396a](https://github.com/Tencent/tmagic-editor/commit/36f396ac2452605192a04a8253204f82d062f6c0)), closes [#401](https://github.com/Tencent/tmagic-editor/issues/401)
* table切换成TMagicDesign ([32a24ad](https://github.com/Tencent/tmagic-editor/commit/32a24ad578b8f43b56b2c251c53eb3cfb78f2c56))



# [1.2.0-beta.2](https://github.com/Tencent/tmagic-editor/compare/v1.2.0-beta.1...v1.2.0-beta.2) (2022-09-28)


### Bug Fixes

* **editor:** codeblock slot参数修改 ([2ac3645](https://github.com/Tencent/tmagic-editor/commit/2ac3645bb028335bd4354e1b3e57be42ff1311d4))
* **editor:** slot修改,schema声明修改 ([0baec3e](https://github.com/Tencent/tmagic-editor/commit/0baec3e532011b6ae8d019e311d471d4be76ef51))
* **editor:** 修复warning,修改playground dsl codeBlocks字段 ([85951de](https://github.com/Tencent/tmagic-editor/commit/85951de24d88957c89483525ed49b5263cb31a8b))
* **editor:** 修复初始dsl无codeBlocks字段时无法新增的问题 ([3bb8ecc](https://github.com/Tencent/tmagic-editor/commit/3bb8ecc97547e9a7838b97b1a182c371efb01a6c))
* **eidtor:** cr问题修改 ([551da1a](https://github.com/Tencent/tmagic-editor/commit/551da1a64b3402cec3ce89e304cae905f702a250))
* **runtime:** 切换设计窗体大小时，同时修改app ([b3bae36](https://github.com/Tencent/tmagic-editor/commit/b3bae36d942f00f9039c5bb6b7124668fd8278d7))
* **stage:** 旋转、缩放组件后没有更新dsl ([bbb5927](https://github.com/Tencent/tmagic-editor/commit/bbb5927e0c78c482a602d15fda8e8cd6ba0a1058))
* **table:** action display ([6a65ab8](https://github.com/Tencent/tmagic-editor/commit/6a65ab812b16deda5e7dcb59f7af8400866978eb))


### Features

* **editor:** code组件新增height配置 ([c87e3b2](https://github.com/Tencent/tmagic-editor/commit/c87e3b2164d7520df1d14d997e94e411d176b89c))
* **editor:** code组件新增options props ([1c35650](https://github.com/Tencent/tmagic-editor/commit/1c3565035c854bf6259077840a5557b9bae8b70d))
* **editor:** 导出CodeBlockList组件 ([caa4782](https://github.com/Tencent/tmagic-editor/commit/caa47823be599ba33679412085b6b35b41c43b29))
* **editor:** 导出CodeSelect组件 ([869b9f2](https://github.com/Tencent/tmagic-editor/commit/869b9f23cb959826eab3d7b1577a26fbb611d45e))
* **form:** form-dialog重新打开是form重新渲染 ([6cf1f86](https://github.com/Tencent/tmagic-editor/commit/6cf1f8636c2ecdad926883f80544d164c4c26bd0))


### Reverts

* Revert "fix(editor): codeblock slot参数修改" ([84b24f1](https://github.com/Tencent/tmagic-editor/commit/84b24f11b84a220966a36ed553192560710db711))



# [1.2.0-beta.1](https://github.com/Tencent/tmagic-editor/compare/v1.1.6...v1.2.0-beta.1) (2022-09-22)


### Bug Fixes

* **core:** 修复执行代码块的顺序问题 ([c3b5022](https://github.com/Tencent/tmagic-editor/commit/c3b502254b4cfac5f14af9173a6e1737732c1745))
* **editor:** dsl存储代码块的字段改为methods ([fa01497](https://github.com/Tencent/tmagic-editor/commit/fa0149773fb8435c099bb98eb91657c70e7599e3))
* **editor:** icon使用editor封装的icon组件 ([441a412](https://github.com/Tencent/tmagic-editor/commit/441a412817f01a1847b48dc4423c0d740a77f749))
* **editor:** 代码块删除支持传参处理失败逻辑,ts类型修复 ([896f92b](https://github.com/Tencent/tmagic-editor/commit/896f92b5a88729f3178c3556932e761a9fcd37c0))
* **editor:** 修复从dsl初始化时代码块绑定关系未同步的问题 ([2356ff5](https://github.com/Tencent/tmagic-editor/commit/2356ff514d0a8019cac8b2b57fdbac29495200e0))
* **editor:** 修复从dsl初始化时代码块绑定关系未同步的问题,修复一些warning,优化语法报错时保存并关闭的交互逻辑 ([134efbf](https://github.com/Tencent/tmagic-editor/commit/134efbfb0f2eed8e536cc17ed6d1add260e5bd43))
* **editor:** 修复语法报错 ([8b9ac82](https://github.com/Tencent/tmagic-editor/commit/8b9ac826fcf624f65c30197f5b6757e74d45dbd6))
* **editor:** 修复通过dsl初始化代码块时,点击查看获取不到绑定的代码块的问题 ([4e6fbab](https://github.com/Tencent/tmagic-editor/commit/4e6fbab26de062a3784bf3c89c24850ef910f109))
* **editor:** 修改样式,修改代码块ID生成逻辑 ([a452cec](https://github.com/Tencent/tmagic-editor/commit/a452cecc444a155efa1a7a25391125b03677ffe7))
* **editor:** 导出CodeBlockList组件 ([8a9971a](https://github.com/Tencent/tmagic-editor/commit/8a9971ab7b4dc1e43a407af0a5ce0b47bed7c6ec))
* **editor:** 样式优化 ([27d8640](https://github.com/Tencent/tmagic-editor/commit/27d8640fbc48184e4f73aac180f4f35638f92a1a))
* **editor:** 样式修改,editor pannel使用resize组件 ([c2637b1](https://github.com/Tencent/tmagic-editor/commit/c2637b1b0cb10dd2f6ee2199916d3881a9d0f071))
* **editor:** 绑定关系组件增加option来源的默认逻辑 ([ddd22ff](https://github.com/Tencent/tmagic-editor/commit/ddd22ff486c28bbc55d86190f263648ebf32f94f))
* **editor:** 绑定关系组件支持单选配置 ([7b961f1](https://github.com/Tencent/tmagic-editor/commit/7b961f128424c95ca20a9c4fbe3290f114ab865b))
* **editor:** 解决修改代码名称后已选择的select tag不更新的问题,优化一些样式 ([bc000e9](https://github.com/Tencent/tmagic-editor/commit/bc000e9ca606ea744a2ecf4da58b2aa71681c38b))
* **editor:** 默认展开组件列表 ([37181d3](https://github.com/Tencent/tmagic-editor/commit/37181d3084a9735e7a54d50b00632cd99e3da288))
* **stage:** 修复ctrl+tab切到其他窗口引起多选状态混乱的问题 ([09c9af8](https://github.com/Tencent/tmagic-editor/commit/09c9af8454babbebe7cb5e076d62025527eeff80))


### Features

* **core:** 修改core生命周期钩子处理逻辑,执行对应的代码块 ([310ee32](https://github.com/Tencent/tmagic-editor/commit/310ee32d75bc9d87c8558be3c35be971716aec9a))
* **editor):** 组件绑定代码块form表单配置 ([7020ab4](https://github.com/Tencent/tmagic-editor/commit/7020ab4a1fcc50a9ad90c7688545c5292c505918))
* **editor:** codeBlockService.getCodeDsl支持增加是否强制刷新参数 ([fc749b7](https://github.com/Tencent/tmagic-editor/commit/fc749b7375af33a1c7cf8d4323e2f220164917d9))
* **editor:** codeBlockService暴露一些方法支持hook,默认设置代码块到dsl的method字段 ([5b220a0](https://github.com/Tencent/tmagic-editor/commit/5b220a0e061e2a54ff87703eccb33954276844a4))
* **editor:** 代码块service封装完成 ([7640c06](https://github.com/Tencent/tmagic-editor/commit/7640c06ccb554b3ff28b65ee551cebfccc1c5f53))
* **editor:** 代码块功能增加删除,完善一些边界情况的交互 ([2f803c9](https://github.com/Tencent/tmagic-editor/commit/2f803c963a8c02b1244387c435e6e01ccdee183a))
* **editor:** 代码块功能新增slot ([452c80d](https://github.com/Tencent/tmagic-editor/commit/452c80d829e3e127a51ac9c5cb1356bc4eafba61))
* **editor:** 代码块新增,编辑器保存至dsl ([0c2c33f](https://github.com/Tencent/tmagic-editor/commit/0c2c33f85431e29e0857ed1d755772acb7deaa6c))
* **editor:** 代码块绑定功能完成 ([0c25cf7](https://github.com/Tencent/tmagic-editor/commit/0c25cf795fa44e97bc98b75aa37c11e3505789e8))
* **editor:** 代码块编辑区改为使用弹窗,代码块slot完善 ([f1242ee](https://github.com/Tencent/tmagic-editor/commit/f1242ee3f46ca2ba7df2c88033772680f74aaf9e))
* **editor:** 增加代码块搜索,代码编辑器同步设置是否可编辑属性,修复不可编辑状态下弹窗无法关闭的问题 ([9e1fb42](https://github.com/Tencent/tmagic-editor/commit/9e1fb42783afa05849bde8a9e27082a02d9ff69a))
* **editor:** 导出codeBlockService ([25d9de1](https://github.com/Tencent/tmagic-editor/commit/25d9de10e26e71c1e7ca73ab128bf829245a0c56))
* **editor:** 支持代码块维度查看与组件的绑定关系,并支持从代码块列表解除绑定 ([bfaa831](https://github.com/Tencent/tmagic-editor/commit/bfaa8317e36db9c0387e041820f075a98a3887b5))
* **editor:** 新增,编辑代码块完成 ([2a8cfe5](https://github.com/Tencent/tmagic-editor/commit/2a8cfe58c4c0b86d48b759f92665bb4705cd1530))
* **editor:** 暂时隐藏代码块列表删除组件功能,支持点击组件tag定位到组件 ([0b3585c](https://github.com/Tencent/tmagic-editor/commit/0b3585c150505dfa93c86d5421b392f2551e2579))
* **editor:** 组件代码块的绑定关系记录到dsl中,修复删除组件解除关系的问题,代码块dsl支持扩展字段 ([92f3696](https://github.com/Tencent/tmagic-editor/commit/92f3696e4432b70bdd2d9ab5de36f9f3df0238c3))
* **form:** select动态监听事件优化 ([040d5d0](https://github.com/Tencent/tmagic-editor/commit/040d5d0d2c7f5a857c7d57e56dd6050940f62e4a))



## [1.1.6](https://github.com/Tencent/tmagic-editor/compare/v1.1.5...v1.1.6) (2022-09-22)


### Bug Fixes

* **core:** 保证传参行为一致 ([b0419cd](https://github.com/Tencent/tmagic-editor/commit/b0419cdbaf8fab2ea17edd650fb10155913e69f7))
* **core:** 修复emit 无node时的情况 ([34b628c](https://github.com/Tencent/tmagic-editor/commit/34b628cc07100b33dab462d19b299fbb4ad11676))
* **core:** 修复多组件同一事件监听问题修改后导致的共通点击失效问题 ([a96d547](https://github.com/Tencent/tmagic-editor/commit/a96d547c20b1c808d5399dcb0435b56513b759ac))
* **editor:** layer-node-content slot参数出错 ([4643acb](https://github.com/Tencent/tmagic-editor/commit/4643acb0f8c67c0bdb0fabecd5bf10e262a81aa1))


### Features

* **cli:** 添加dynamicImport配置参数，用于设置是否使用import()来加载组件 ([c817ad6](https://github.com/Tencent/tmagic-editor/commit/c817ad6bb680a84453ef3d99de14c8d8a36b1f58)), closes [#366](https://github.com/Tencent/tmagic-editor/issues/366)
* **editor:** 新增layer-node-content slot,用于定制组件树节点 ([cda0c41](https://github.com/Tencent/tmagic-editor/commit/cda0c41ad499e5e8ec7b66ddaae607ad96633c5a)), closes [#368](https://github.com/Tencent/tmagic-editor/issues/368)
* **form:** table新增showIndex配置，用于控制是否显示行索引 ([560a3ac](https://github.com/Tencent/tmagic-editor/commit/560a3acfae2e467faa894ed16067ebeb941c6fef))
* **form:** table配置支持showIndex用于控制行号 ([eb03ce3](https://github.com/Tencent/tmagic-editor/commit/eb03ce358fd1ccaeb1b2f82285804d1c24349262))
* **runtime:** vue3使用dynamicImport ([a16a7e6](https://github.com/Tencent/tmagic-editor/commit/a16a7e6a4d8a072ca94f5c2c50a17bfbf70279af))



## [1.1.5](https://github.com/Tencent/tmagic-editor/compare/v1.1.4...v1.1.5) (2022-09-20)


### Bug Fixes

* **core:** 多个组件配置同一事件会导致此事件多次监听 ([b835bb2](https://github.com/Tencent/tmagic-editor/commit/b835bb24888db3ee150192ef10726de8f7c5ec3b)), closes [#356](https://github.com/Tencent/tmagic-editor/issues/356)
* **editor:** code-link组件内容不更新 ([e069783](https://github.com/Tencent/tmagic-editor/commit/e0697833dab7b2b3850b955312ca1e71379cf848))
* **editor:** layout ([30bb39d](https://github.com/Tencent/tmagic-editor/commit/30bb39d71ae481cc55c3c98824e74f502f48a23d))
* **editor:** 添加组件后，只有在位置有调整的情况才再次更新组件 ([22c57f4](https://github.com/Tencent/tmagic-editor/commit/22c57f444fdf760bfcfa1d5a72303109609bbb2c))
* **form:** link组件parentValues没有传递下去 ([d76c753](https://github.com/Tencent/tmagic-editor/commit/d76c753483c085afc7b062a240fa0e89450ba910))
* **playgound:** npm run serve后runtime无法打开 ([ddf0fcd](https://github.com/Tencent/tmagic-editor/commit/ddf0fcdecce14a924ffbd3690a36fff467ca98bc)), closes [#352](https://github.com/Tencent/tmagic-editor/issues/352)
* **playground:** npm run dev后proxy失效 ([6d6490a](https://github.com/Tencent/tmagic-editor/commit/6d6490ab311696e1b525f73d994837a04bd08d10))


### Features

* **editor:** 新增Layout ([835189a](https://github.com/Tencent/tmagic-editor/commit/835189adc9c0047bdedc31ae0367c08c1cf6024d))



## [1.1.4](https://github.com/Tencent/tmagic-editor/compare/v1.1.3...v1.1.4) (2022-09-15)


### Bug Fixes

* **editor:** 添加页面，应该添加到最后 ([10d2b3c](https://github.com/Tencent/tmagic-editor/commit/10d2b3cc9b5460ee4c406ca731520ffc2d1906ef))
* **editor:** 画布大小变化，滚动条重置 ([bee9f92](https://github.com/Tencent/tmagic-editor/commit/bee9f92abbb6a673bf5185c79431cb7ad2fbd81f))
* **editor:** 页面列表是否可以滚动判断不准确 ([3ff823a](https://github.com/Tencent/tmagic-editor/commit/3ff823a59fd5c4afb6c36d4a9e150365a7801258))
* **stage:** 当选中的组件与上一次选中的组件有重叠时，选中后的下一个click事件丢失 ([33a09cc](https://github.com/Tencent/tmagic-editor/commit/33a09cccc7548a1264daaec9b77c3ff924b2969b))
* **ui:** 修复text组件在流式容器内无宽高问题 ([695efc0](https://github.com/Tencent/tmagic-editor/commit/695efc00a8c5c4dfc88dbcb3ce71db6dbc1656f7))
* **ui:** 追加 vue2 和 react 的修改 ([45be838](https://github.com/Tencent/tmagic-editor/commit/45be838f20c784e946a6e5cd3ea0bfc3a3741b67))


### Features

* **editor:** uiService支持插件扩展 ([b915acc](https://github.com/Tencent/tmagic-editor/commit/b915accb7155ce3155ee3076d2d848ea1dd65f3e))
* **table:** 添加loading参数 ([ee36127](https://github.com/Tencent/tmagic-editor/commit/ee361271e70565a413985388da501dac2e769c4b))



## [1.1.3](https://github.com/Tencent/tmagic-editor/compare/v1.1.2...v1.1.3) (2022-09-13)


### Bug Fixes

* **editor:** 修复流式布局下移动图层操作相反问题 ([e0a16bc](https://github.com/Tencent/tmagic-editor/commit/e0a16bcf0a1b87932137567e711beb7f0e463848))
* **form:** 当默认值为0时，select 远程选项初始化不正确 ([e855072](https://github.com/Tencent/tmagic-editor/commit/e8550728d1f58c55deb9d5c26bd5942a9adf9720))



## [1.1.2](https://github.com/Tencent/tmagic-editor/compare/v1.1.1...v1.1.2) (2022-09-08)


### Bug Fixes

* **editor:** 画布缩放后，拖入组件位置错位 ([bdd544e](https://github.com/Tencent/tmagic-editor/commit/bdd544e87e7c4f4b227d65f3afd4de14af826e17))


### Features

* **editor:** 支持控制pagebar中新增按钮显隐 ([3e024d2](https://github.com/Tencent/tmagic-editor/commit/3e024d21edca7dc3bcc00b8aae23b231ee8e1a54))
* **editor:** 添加compoent-list-item slot ([c307386](https://github.com/Tencent/tmagic-editor/commit/c3073861907abb01b57b9632bb9c2c9108203379))



## [1.1.1](https://github.com/Tencent/tmagic-editor/compare/v1.1.0...v1.1.1) (2022-08-31)


### Bug Fixes

* **core:** 解决固定元素失效问题 ([8db7821](https://github.com/Tencent/tmagic-editor/commit/8db7821032080cdcc74a5e8412d05bc978793932))
* **editor:** 没有页面时，添加页面出错 ([e67cbce](https://github.com/Tencent/tmagic-editor/commit/e67cbceb7d4d1a047e9849a171045e85661ae71f))



# [1.1.0](https://github.com/Tencent/tmagic-editor/compare/v1.1.0-beta.13...v1.1.0) (2022-08-30)


### Bug Fixes

* **editor,stage,ui,runtime:** 流式布局下，height自动设置成auto ([2201fbe](https://github.com/Tencent/tmagic-editor/commit/2201fbe80c5e14254c4f5746f1b82209711aef5e)), closes [#298](https://github.com/Tencent/tmagic-editor/issues/298)
* **editor:** 添加remove事件时的参数 ([3af6f11](https://github.com/Tencent/tmagic-editor/commit/3af6f11f9f851accd396e917ecb4f03dd7bb2162))
* **stage:** 流式布局resize从上或者左边调整，选中框出现错位 ([9e16747](https://github.com/Tencent/tmagic-editor/commit/9e167474a2ff2f937e1e0c3861bf8451f19cbc48)), closes [#297](https://github.com/Tencent/tmagic-editor/issues/297)


### Features

* **editor:** 创建新组件时的顺序 ([#316](https://github.com/Tencent/tmagic-editor/issues/316)) ([6c0b92e](https://github.com/Tencent/tmagic-editor/commit/6c0b92e80887f10c92ee9ecf450ebca4a0bc2fec))
* **editor:** 编辑器销毁后销毁services ([4a59b4b](https://github.com/Tencent/tmagic-editor/commit/4a59b4b0f49a6e608361980723429b1f362a82c1))
* **stage:** 多选支持resize ([793d02a](https://github.com/Tencent/tmagic-editor/commit/793d02a7067f59806655938aaa35a34e23dcbb75)), closes [#302](https://github.com/Tencent/tmagic-editor/issues/302)



# [1.1.0-beta.13](https://github.com/Tencent/tmagic-editor/compare/v1.1.0-beta.12...v1.1.0-beta.13) (2022-08-29)


### Features

* **editor:** 去掉画布根据视窗大小自动调整缩放比例，加上缩放到实际大小/缩放以适应菜单按钮 ([dd3075b](https://github.com/Tencent/tmagic-editor/commit/dd3075be56a08c1e10b20f48260546d2ad438510))
* **editor:** 画布添加滚动条 ([de8ef8d](https://github.com/Tencent/tmagic-editor/commit/de8ef8dc58d686adfd940f5be2de5b4285339606)), closes [#262](https://github.com/Tencent/tmagic-editor/issues/262)



# [1.1.0-beta.12](https://github.com/Tencent/tmagic-editor/compare/v1.1.0-beta.11...v1.1.0-beta.12) (2022-08-24)


### Bug Fixes

* **editor:** 上移一层通知runtime更新参数出错 ([9b9c9db](https://github.com/Tencent/tmagic-editor/commit/9b9c9db683596958803b02e11cc055b2660127a0)), closes [#282](https://github.com/Tencent/tmagic-editor/issues/282)
* **editor:** 修复 update 返回值三目运算符判断错误的问题，同时优化输入与输入类型一致。 ([9b0db4a](https://github.com/Tencent/tmagic-editor/commit/9b0db4a8071ec511f03131a604157584be3b7f55))
* **editor:** 修复Add返回数组还是对象的逻辑 ([547e733](https://github.com/Tencent/tmagic-editor/commit/547e733c655872e6039dda9958f628fce799b187))
* **editor:** 拖拽改变父容器时错乱现象 ([#296](https://github.com/Tencent/tmagic-editor/issues/296)) ([f3c9ba4](https://github.com/Tencent/tmagic-editor/commit/f3c9ba475ff5484ecbf69b533d04bb6129a7629f))
* **editor:** 组件属性表单配置默认值 ([5529bbc](https://github.com/Tencent/tmagic-editor/commit/5529bbc6e162def24fbdfcbf89936318c0f9e945))


### Features

* **editor:** propsService添加fillConfig方法，支持扩展 ([31029bc](https://github.com/Tencent/tmagic-editor/commit/31029bc8f1178e3eb1450c779253ed17bcc93bf0))
* **editor:** 添加stage slot ([98bc4e2](https://github.com/Tencent/tmagic-editor/commit/98bc4e2dbb6082dfc66f5248b079a521fb1f7725))



# [1.1.0-beta.11](https://github.com/Tencent/tmagic-editor/compare/v1.1.0-beta.10...v1.1.0-beta.11) (2022-08-19)


### Bug Fixes

* **cli:** window下路径分隔符\转换为/ ([4e4cae4](https://github.com/Tencent/tmagic-editor/commit/4e4cae4a7773b0916c9ed3cfd5549ce6b0077c8e)), closes [#286](https://github.com/Tencent/tmagic-editor/issues/286)
* **editor:** 解决UISelect控制台警告 ([#289](https://github.com/Tencent/tmagic-editor/issues/289)) ([0536ac2](https://github.com/Tencent/tmagic-editor/commit/0536ac29ae21b06fd8bbe1c31d6c9f1bf464efb8))
* **ui,runtime:** 组件注册默认以magic-ui-xx的形式，不再需要在组件中设置name ([de38035](https://github.com/Tencent/tmagic-editor/commit/de380357ee45f74e35465bb48e5447720116fd42)), closes [#291](https://github.com/Tencent/tmagic-editor/issues/291)


### Features

* **admin:** 更新runtime ([aed4b42](https://github.com/Tencent/tmagic-editor/commit/aed4b42191a9b5c2d856cb850eaf100cce55ce9f))
* **cli:** 添加onInit/onPrepare配置 ([87f1bfb](https://github.com/Tencent/tmagic-editor/commit/87f1bfbdd659172ec493cda9111bad049bc4bc73))
* **editor:** 记住组件树节点展开的状态 ([143bded](https://github.com/Tencent/tmagic-editor/commit/143bded648ddf07d3ab8ab78c7108f4a8f545f7d)), closes [#283](https://github.com/Tencent/tmagic-editor/issues/283)



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



