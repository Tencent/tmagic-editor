import{At as e,E as t,Mt as n,Ot as r,Xt as i,en as a}from"./chunks/framework.ECw2lWOt.js";var o=JSON.parse(`{"title":"联动原理","description":"","frontmatter":{},"headers":[],"relativePath":"guide/advanced/coupling.md","filePath":"guide/advanced/coupling.md"}`),s={name:`guide/advanced/coupling.md`};function c(t,o,s,c,l,u){let d=a(`demo-block`);return i(),r(`div`,null,[o[0]||=e("",6),n(d,{type:`form`,config:`[{
  text: '文本',
  name: 'text'
}, {
  type: 'select',
  text: '下拉选项',
  name: 'select',
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 }
  ],
  onChange: (vm, value, { model }) => {
    model.text = value;
  }
}]`}),o[1]||=e("",23)])}var l=t(s,[[`render`,c]]);export{o as __pageData,l as default};