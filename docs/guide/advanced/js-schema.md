# JS Schema
tmagic-editor的业务组件需要有表单配置能力，我们通过一份配置来描述表单，我们采用的描述方案是 JS schema。当我们在编辑器中配置一个页面时，页面的基本信息和页面包含的组件信息，也是采用 JS schema 描述的。JS schema 描述方案，也是我们提供[代码块](../advanced/code-block)功能的基础。

组件的**配置描述**，参考[示例](./tmagic-form.html#示例)，是由开发者在开发组件时，通过 [@tmagic/form](./tmagic-form) 支持的表单项来提供的。

在编辑器中对页面进行编辑，保存得到的是一份关于页面基本信息、页面所包含组件以及组件配置信息的配置，我们称为 **DSL**，这份配置是最终页面渲染需要的描述信息。

JS schema 本质即是一个 js 对象，这个形式可以支持我们在组件的表单配置描述中，直接进行函数编写，功能灵活，对于前端开发来说更符合直觉，几乎没有理解成本。

## 表单配置
组件中的表单配置描述，在经过 @tmagic/form 表单渲染器后，可以生成表单栏的配置项。在表单栏中对表单进行配置，配置数据将动态写入 DSL 中。

<img src="https://image.video.qpic.cn/oa_88b7d-36_673631168_1636343947880034?imageView2/q/70">

## DSL
编辑器中生成的 DSL 序列化存储后，在发布时，将其作为 js 文件发布出去，供生成页使用。一个生成页最终保存的 DSL 配置示例如下：

```javascript
{
  id: "75f0extui9d7yksklx27hff8xg",
  name: "test_page",
  type: "app",
  beginTime: "2021-04-26T16:00:00.000Z",
  endTime: "2021-05-28T16:00:00.000Z",
  items: [
    {
      type: "page",
      name: "index",
      title: "1",
      layout: "absolute",
      style: {
        width: "375",
        height: "1728",
        backgroundColor: "rgba(218, 192, 192, 1)"
      },
      id: "39381280",
      items: [
        {
          type: "container",
          name: "组",
          id: "98549062",
          items: [
            {
              type: "button",
              id: "87016850",
              name: "按钮",
              style: {
                position: "absolute",
                left: 57,
                top: 152,
                right: "",
                bottom: "",
                width: 270,
                height: 38,
                backgroundImage: "",
                backgroundColor: "#fb6f00",
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 100%",
                transform: "none",
                textAlign: "center",
                border: 0
              },
              events: [
                {
                  name: "magic:common:events:click",
                  to: "button_3877",
                  method: ""
                }
              ],
              created: ()=>{},
              text: "请输入文本内容",
            },
            {
              id: "text_7909",
              style: {
                left: 88,
                top: -73,
                position: "absolute",
                width: 100,
                height: 14,
                transform: "none"
              },
              type: "text",
              name: "文本",
              text: "请输入文本内容",
              multiple: true,
            },
            {
              type: "button",
              id: "button_3877",
              style: {
                position: "absolute",
                left: "57",
                width: "270",
                height: "37.5",
                border: 0,
                backgroundColor: "#fb6f00"
              },
              name: "按钮",
              text: "请输入文本内容",
              multiple: true,
            }
          ],
          style: {
            width: "100%",
            height: "100",
            position: "absolute",
            left: 0,
            top: 204
          }
        }
      ]
    },
  ]
}
```